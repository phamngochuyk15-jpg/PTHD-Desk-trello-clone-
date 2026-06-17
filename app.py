import os
import json
import datetime
from flask import Flask, request, jsonify, send_from_directory
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Load các biến môi trường từ file .env
load_dotenv()

app = Flask(__name__, static_folder='dist')
PORT = 3000
DB_FILE = os.path.join(os.getcwd(), "kanban_db.json")

# ==========================================
# HELPER: CẤU HÌNH & DỌN DẸP GEMINI AI
# ==========================================
def get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("CẢNH BÁO: GEMINI_API_KEY chưa được thiết lập. AI sẽ chạy ở chế độ giả lập.")
        return None
    # Khởi tạo Client theo chuẩn SDK mới nhất
    return genai.Client(api_key=api_key)

# Hàm "máy hút bụi" phiên bản ĐẶC NHIỆM: Chỉ lấy đúng ruột JSON
def clean_json_response(text):
    if not text:
        return {}
        
    # Tìm vị trí của dấu ngoặc nhọn đầu tiên và cuối cùng
    start_idx = text.find('{')
    end_idx = text.rfind('}')
    
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        # Cắt lấy đúng phần văn bản nằm giữa 2 dấu ngoặc
        json_str = text[start_idx:end_idx+1]
        try:
            return json.loads(json_str)
        except Exception as e:
            print(f"Lỗi bóc tách JSON: {e}")
            
    # Phương án dự phòng nếu AI "ngáo" đến mức không trả về JSON
    return {
        "text": "Xin lỗi, đường truyền AI vừa bị nhiễu định dạng một chút xíu. Cậu nhắc lại câu lệnh giúp mình nhé!",
        "suggestedActions": []
    }

# ==========================================
# CƠ SỞ DỮ LIỆU MẶC ĐỊNH
# ==========================================
DEFAULT_BOARD = {
    "id": "default-project",
    "title": "Bài Tập Nhỏ K15THO1",
    "columns": [
        { "id": "todo", "title": "Cần làm", "color": "bg-slate-100 border-slate-200 text-slate-800" },
        { "id": "in_progress", "title": "Đang làm", "color": "bg-indigo-50/70 border-indigo-100 text-indigo-900" },
        { "id": "review", "title": "Xem xét & Đánh giá", "color": "bg-amber-50/70 border-amber-100 text-amber-900" },
        { "id": "done", "title": "Hoàn thành", "color": "bg-emerald-50/70 border-emerald-100 text-emerald-900" }
    ],
    "tasks": [
        {
            "id": "task-1",
            "title": "Thiết kế wireframe & UI/UX trang chủ",
            "description": "Phác thảo sơ đồ màn hình Desktop và Mobile cho trang landing page của sản phẩm.",
            "category": "Design",
            "priority": "high",
            "subtasks": [
                { "id": "sub-1-1", "text": "Vẽ nháp trên giấy", "completed": True },
                { "id": "sub-1-2", "text": "Thiết kế Figma component", "completed": False },
                { "id": "sub-1-3", "text": "Xin ý kiến góp ý của team", "completed": False }
            ],
            "createdAt": datetime.datetime.utcnow().isoformat() + "Z",
            "columnId": "todo"
        },
        {
            "id": "task-2",
            "title": "Cài đặt cơ sở dữ liệu & API Gateway",
            "description": "Thiết lập database PostgreSQL và định nghĩa các API routes cơ bản cho ứng dụng quản lý.",
            "category": "Backend",
            "priority": "medium",
            "subtasks": [
                { "id": "sub-2-1", "text": "Thiết kế database schema", "completed": True },
                { "id": "sub-2-2", "text": "Tạo router NodeJS", "completed": True }
            ],
            "createdAt": datetime.datetime.utcnow().isoformat() + "Z",
            "columnId": "in_progress"
        }
    ]
}

def read_db():
    try:
        if os.path.exists(DB_FILE):
            with open(DB_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        print(f"Lỗi đọc DB, dùng dữ liệu mẫu: {e}")
    return DEFAULT_BOARD

def write_db(data):
    try:
        with open(DB_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Lỗi ghi DB: {e}")

if not os.path.exists(DB_FILE):
    write_db(DEFAULT_BOARD)

# ==========================================
# CÁC HÀM GIẢ LẬP (FALLBACK)
# ==========================================
def fallback_classify(title, desc):
    lower_title = f"{title} {desc}".lower()
    category = "Frontend"
    priority = "medium"
    
    if any(k in lower_title for k in ["design", "thiết kế", "giao diện", "figma", "ui", "ux"]):
        category = "Design"
    elif any(k in lower_title for k in ["api", "database", "sql", "server", "backend", "cơ sở dữ liệu"]):
        category = "Backend"
    elif any(k in lower_title for k in ["marketing", "sale", "quảng cáo", "khách hàng"]):
        category = "Marketing"
    elif any(k in lower_title for k in ["test", "kiểm thử", "bug", "lỗi"]):
        category = "Testing"

    if any(k in lower_title for k in ["gấp", "khẩn cấp", "ngay", "quan trọng", "critical", "high"]):
        priority = "high"
    elif any(k in lower_title for k in ["thong thả", "rảnh", "low", "nhẹ"]):
        priority = "low"

    return {
        "category": category,
        "priority": priority,
        "reason": "Phân loại tự động (Dựa trên từ khóa có trong tiêu đề/mô tả). Thêm khóa API Gemini trong cài đặt để dùng mô hình AI thật."
    }

def fallback_decompose(title):
    return [
        { "text": f'Tìm hiểu các yêu cầu cụ thể liên quan đến "{title}"' },
        { "text": "Phác thảo giải pháp và phân tách các phần cấu phần chính" },
        { "text": "Tiến hành triển khai thực tế công việc" },
        { "text": "Kiểm tra chất lượng và xem xét lại kết quả hoàn thành" }
    ]

# ==========================================
# ROUTES GIAO DIỆN REACT (STATIC)
# ==========================================
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

# ==========================================
# ROUTES API: KANBAN BOARD
# ==========================================
@app.route("/api/board", methods=["GET"])
def get_board():
    return jsonify(read_db())

@app.route("/api/board", methods=["POST"])
def save_board():
    updated_data = request.json
    if not updated_data or "columns" not in updated_data or "tasks" not in updated_data:
        return jsonify({"error": "Dữ liệu bảng không hợp lệ."}), 400
    write_db(updated_data)
    return jsonify({"success": True, "message": "Đã lưu bảng thành công."})

# ==========================================
# ROUTES API: AI ENDPOINTS
# ==========================================
@app.route("/api/ai/classify", methods=["POST"])
def ai_classify():
    data = request.json
    title = data.get("title", "")
    description = data.get("description", "")
    
    if not title:
        return jsonify({"error": "Yêu cầu tiêu đề task."}), 400

    client = get_gemini_client()
    if not client:
        return jsonify(fallback_classify(title, description))

    prompt = f"""Phân loại công việc (Kanban Task) sau đây:
Tiêu đề: "{title}"
Mô tả: "{description if description else 'Không có mô tả'}"

Hãy trả về định dạng JSON với các thông tin sau:
1. category: Gợi ý nhãn phù hợp nhất (ví dụ: "Frontend", "Backend", "Design", "Marketing", "Testing", "DevOps", "Database" hoặc một nhãn chuyên môn ngắn gọn bằng Tiếng Anh 1-2 từ, viết hoa chữ cái đầu).
2. priority: Độ ưu tiên phù hợp nhất dựa trên tính chất công việc ("low", "medium", "high").
3. reason: Một câu ngắn gọn giải thích lý do gợi ý nhãn này (bằng Tiếng Việt)."""

    try:
        response = client.models.generate_content(
            model='gemini-3.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        return jsonify(clean_json_response(response.text))
    except Exception as e:
        print(f"Gemini Classify Error: {e}")
        return jsonify(fallback_classify(title, description))


@app.route("/api/ai/decompose", methods=["POST"])
def ai_decompose():
    data = request.json
    title = data.get("title", "")
    description = data.get("description", "")
    
    if not title:
        return jsonify({"error": "Tiêu đề công việc là bắt buộc."}), 400

    client = get_gemini_client()
    if not client:
        return jsonify({"subtasks": fallback_decompose(title)})

    prompt = f"""Hãy đóng vai trò là một quản lý dự án chuyên nghiệp và phân tách công việc lớn sau đây thành 4 đến 6 đầu việc nhỏ/subtasks hành động được ngay:
Công việc lớn: "{title}"
Mô tả chi tiết: "{description if description else 'Không có mô tả'}"

Hãy trả về một danh sách JSON mẫu có cấu trúc như sau:
{{
  "subtasks": [
    {{ "text": "Hành động cụ thể 1" }},
    {{ "text": "Hành động cụ thể 2" }}
  ]
}}
Yêu cầu: Nội dung hành động viết rõ ràng, dễ hiểu, bằng Tiếng Việt, mỗi đầu việc khoảng 5-15 từ."""

    try:
        response = client.models.generate_content(
            model='gemini-3.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        return jsonify(clean_json_response(response.text))
    except Exception as e:
        print(f"Gemini Decompose Error: {e}")
        return jsonify({"subtasks": fallback_decompose(title)})


@app.route("/api/ai/summarize", methods=["POST"])
def ai_summarize():
    data = request.json
    columns = data.get("columns", [])
    tasks = data.get("tasks", [])
    
    if not columns or not tasks:
        return jsonify({"error": "Yêu cầu đầy đủ dữ liệu cấu trúc bảng."}), 400

    client = get_gemini_client()
    if not client:
        total = len(tasks)
        completed_count = sum(1 for t in tasks if t.get("columnId") == "done")
        doing_count = sum(1 for t in tasks if t.get("columnId") == "in_progress")
        rate = round((completed_count / total) * 100) if total > 0 else 0
        high_priority_pending = sum(1 for t in tasks if t.get("priority") == "high" and t.get("columnId") != "done")
        
        fallback_text = f"""### 📊 Báo cáo Tiến độ Dự án (Bản giả lập)

Chào bạn, đây là tóm tắt nhanh tiến trình công việc từ Trợ lý ảo do chưa kích hoạt kết nối API Gemini:

* **Tổng số công việc:** **{total} tasks**
* **Hoàn thành:** **{completed_count}** ({rate}%)
* **Đang xử lý:** **{doing_count}** tasks đang tích cực thực hiện.

#### 🔍 Điểm nghẽn tiêu biểu:
* Phát hiện có **{high_priority_pending} công việc ưu tiên cao (High Priority)** vẫn chưa được hoàn thành. Đội ngũ nên lưu ý giải phóng các task này trước.

#### 💡 Đề xuất hành động:
1.  **Đẩy nhanh tiến độ các công việc trong cột Đang Làm** để nhanh chóng kiểm thử và đóng gói.
2.  **Chia nhỏ các task lớn** có chứa nhiều subtasks chưa tích hoàn thành để phân phối cho các thành viên tốt hơn.

*Kích hoạt API Key ở góc màn hình (Settings -> Secrets) để nhận phân tích chuyên sâu chi tiết từ Gemini AI thật!*"""
        return jsonify({"summary": fallback_text})

    mapped_tasks = [{
        "title": t.get("title"),
        "columnId": t.get("columnId"),
        "priority": t.get("priority"),
        "category": t.get("category"),
        "subtasks_total": len(t.get("subtasks", [])),
        "subtasks_done": sum(1 for s in t.get("subtasks", []) if s.get("completed"))
    } for t in tasks]

    summary_prompt = f"""Dưới đây là thống kê hiện tại của bảng Kanban công việc:
Danh sách cột: {json.dumps(columns)}
Danh sách các task hiện có: {json.dumps(mapped_tasks)}

Hãy viết một báo cáo tóm tắt tiến độ cực kỳ chuyên nghiệp và truyền cảm hứng bằng Tiếng Việt dưới định dạng Markdown:
Giọng văn: Trực quan, tích cực, sáng rõ, tập trung vào giải quyết vấn đề.
Bao gồm:
1. Tổng quan ngắn gọn (Ví dụ: Số việc hoàn thành, tỉ lệ hoàn thành chung).
2. Phân tích các nút thắt cổ chai tiềm ẩn (Có task nào quan trọng bị trì trệ không? Có quá nhiều việc ở Đang làm / Review không?).
3. Gợi ý hành động tiếp theo cụ thể cho đội ngũ phát triển.
Hãy dùng định dạng Markdown đẹp, dùng bullet points rõ ràng. Không nói quá dài dòng."""

    try:
        response = client.models.generate_content(
            model='gemini-3.5-flash',
            contents=summary_prompt
        )
        return jsonify({"summary": response.text})
    except Exception as e:
        print(f"Gemini Summarize Error: {e}")
        return jsonify({"error": "Lỗi tạo dự án tóm tắt từ Gemini."}), 500


@app.route("/api/ai/chat", methods=["POST"])
def ai_chat():
    data = request.json
    message = data.get("message", "")
    history = data.get("history", [])
    board = data.get("board", {})
    
    if not message:
        return jsonify({"error": "Yêu cầu lời nhắn từ người dùng."}), 400

    client = get_gemini_client()
    if not client:
        reply_text = f'Tôi đã nhận được câu hỏi: "{message}". Để trợ giúp bạn quản lý board tốt nhất, vui lòng cấu hình API Key của bạn. \n\nTuy nhiên, dựa trên nội dung bạn gửi, đây là tư duy gợi ý cho bạn: Bạn có thể thêm task và phân loại chúng vào các cột tương ứng, tập trung giải quyết các thẻ có độ ưu tiên **High** trước tiên!'
        actions = []
        msg_lower = message.lower()
        
        if any(w in msg_lower for w in ["thêm", "tạo", "create", "add"]):
            import re
            detected_title = re.sub(r"(thêm|tạo|task|công việc|thẻ|thẻ việc|ở cột|cột|vào cột)", "", msg_lower, flags=re.IGNORECASE).strip()
            task_title = detected_title.capitalize() if detected_title else "Công việc mới từ Chatbot"
            reply_text = f'Tôi cảm thấy bạn muốn thêm một công việc mới: **"{task_title}"**. Tôi đã chuẩn bị một nút thao tác nhanh ở bên dưới, bạn chỉ cần một lượt nhấp chuột để tự động đưa công việc này vào cột **Cần làm** và phân loại nó ngay lập tức!'
            category = "Design" if ("thiết kế" in msg_lower or "giao diện" in msg_lower) else "Frontend"
            actions.append({
                "label": f'➕ Thêm nhanh task "{task_title[:20]}..."',
                "action": "CREATE_TASK",
                "payload": {
                    "title": task_title,
                    "description": "Được khởi tạo nhanh từ đề xuất chatbot AI",
                    "category": category,
                    "priority": "medium",
                    "columnId": "todo"
                }
            })
        else:
            actions.append({
                "label": "📊 Tóm tắt tiến độ dự án ngay",
                "action": "SUMMARIZE",
                "payload": {}
            })
            
        return jsonify({"text": reply_text, "suggestedActions": actions})

    columns_str = ", ".join([f'{c.get("id")} ({c.get("title")})' for c in board.get("columns", [])]) if board.get("columns") else ""
    tasks_str = "\n".join([f'- [Cột {t.get("columnId")}] Title: "{t.get("title")}", Tag: {t.get("category")}, Priority: {t.get("priority")}, Có {len(t.get("subtasks", []))} subtasks' for t in board.get("tasks", [])]) if board.get("tasks") else ""
    
    text_context = f"""Bảng Kanban hiện tại mang tên: "{board.get('title', 'Dự án')}"
Các cột: {columns_str}
Các task hiện tại:
{tasks_str}""" if board else "Không có thông tin bảng"

    system_instruction = f"""Bạn là Trợ lý Dự án AI thông minh tích hợp trực tiếp trong Kanban Board (ứng dụng giống Trello).
Dưới đây là ngữ cảnh thực tế của dự án của người dùng:
{text_context}

Nhiệm vụ của bạn:
1. Trả lời người dùng một cách thân thiện, nhiệt tình bằng Tiếng Việt.
2. Trợ giúp người dùng lập kế hoạch, phân loại hoặc tóm tắt tiến trình.
3. Khi người dùng nói muốn tạo công việc mới (ví dụ: "thêm task học React", "tạo thẻ việc Thiết kế Database ở cột Cần làm"), hoặc phân rã task cụ thể, bạn cần trả lời bằng văn bản kèm đề xuất một Thao Tác Nhanh (Action Payload) dạng JSON để ứng dụng tự động thực hiện trên UI!

Phản hồi của bạn PHẢI LUÔN LÀ một đối tượng JSON có cấu trúc như sau:
{{
  "text": "Lời thoại trả lời của bạn, viết bằng Markdown Tiếng Việt thật thân thiện, chuyên nghiệp.",
  "suggestedActions": [
    {{
      "label": "Tên nút bấm hiển thị ngắn gọn (ví dụ: '➕ Thêm việc và Phân loại')",
      "action": "CREATE_TASK" hoặc "DECOMPOSE" hoặc "SUMMARIZE",
      "payload": {{
        "title": "Tiêu đề công việc",
        "description": "Mô tả nếu có",
        "category": "Nhãn công việc",
        "priority": "low" hoặc "medium" hoặc "high",
        "columnId": "todo" hoặc "in_progress" hoặc "review" hoặc "done",
        "taskId": "id của task (nếu action là DECOMPOSE)"
      }}
    }}
  ]
}}
Lưu ý: Nếu không cần thực hiện hành động tự động gì đặc biệt, hãy để "suggestedActions" là một mảng rỗng [] hoặc chứa nút 'Tóm tắt tiến trình' (action "SUMMARIZE")."""

    try:
        # Gom lịch sử thành văn bản thuần túy để tránh lỗi "Role" của Gemini
        chat_history_text = "LỊCH SỬ TRÒ CHUYỆN GẦN ĐÂY:\n"
        for h in history[-6:]:
            sender = "Người dùng" if h.get("sender") == "user" else "Trợ lý AI"
            chat_history_text += f"- {sender}: {h.get('text')}\n"

        final_prompt = f"""{chat_history_text}
        
CÂU HỎI MỚI NHẤT CỦA NGƯỜI DÙNG: "{message}"
Hãy dựa vào lịch sử trên và trạng thái Kanban Board để trả lời."""

        response = client.models.generate_content(
            model='gemini-3.5-flash',
            contents=final_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json"
            )
        )
        return jsonify(clean_json_response(response.text))
        
    except Exception as e:
        print(f"Gemini Chat Error: {e}")
        return jsonify({
            "text": "Xin lỗi, đã xảy ra một lỗi nhỏ khi kết nối với máy chủ AI. Hãy kiểm tra lại Terminal log nhé!",
            "suggestedActions": []
        })

if __name__ == "__main__":
    print(f"🚀 Server Python đang chạy tại http://localhost:{PORT}")
    app.run(host="0.0.0.0", port=PORT, debug=True)