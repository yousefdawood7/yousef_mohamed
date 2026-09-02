# 📖 توثيق الـ API - نظام "دكتور حكيم" لتشخيص الأمراض الجلدية (Dr. Hakeem Skin Disease Diagnosis API)

دليل هندسي متكامل ومفصل لمطوري التطبيقات (Mobile Flutter / React Native / iOS / Android) ومطوري الويب (Frontend Web) للربط مع مشروع **Dr. Hakeem API**.

---

## 📌 1. مواصفات النظام العامة (System Specifications)

- **Base URL:** `http://localhost:8000/api/v1` (أو الرابط النهائي في بيئة الإنتاج).
- **Architecture Pattern:** Action-Domain-Responder (ADR) + Service-Repository Pattern.
- **Default Format:** `application/json`.
- **Image Upload Format:** `multipart/form-data`.
- **Authentication:** Laravel Sanctum Bearer Token.
  ```http
  Authorization: Bearer <YOUR_ACCESS_TOKEN>
  Accept: application/json
  ```

---

## 🔐 2. حسابات وبينات المريض (Auth & Patient Profile Domain)

### 2.1 تسجيل حساب جديد (Register)
- **Endpoint:** `POST /api/v1/auth/register`
- **Request Body:**
```json
{
  "name": "سلمى محمد",
  "email": "salma.mohamed@example.com",
  "password": "Password123!",
  "password_confirmation": "Password123!",
  "role": "patient"
}
```
- **Response (201 Created):** يُنشئ الحساب ويُنشئ تلقائياً ملف مريض يحتوي على كود فريد `patient_code` (مثل `PAT-A8F2K1`).

---

### 2.2 تسجيل الدخول (Login)
- **Endpoint:** `POST /api/v1/auth/login`
- **Request Body:**
```json
{
  "email": "ahmed@example.com",
  "password": "Password123!"
}
```

---

### 2.3 جلب ملف المريض (Get Patient Profile)
- **Endpoint:** `GET /api/v1/patient/profile`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "بيانات ملف المريض",
  "data": {
    "id": 1,
    "user_id": 1,
    "patient_code": "PAT-A8F2K1",
    "age": 32,
    "blood_group": "A+",
    "skin_type": "Type II",
    "conditions": ["Diabetes"],
    "active_allergies": ["Penicillin"],
    "settings": {
      "notifications_enabled": true,
      "dark_mode": false,
      "language": "ar"
    }
  }
}
```

---

### 2.4 تحديث إعدادات وملف المريض (Update Patient Settings)
- **Endpoint:** `PUT /api/v1/patient/settings`
- **Headers:** `Authorization: Bearer <TOKEN>`, `Content-Type: application/json`
- **Request Body:**
```json
{
  "age": 33,
  "blood_group": "A+",
  "skin_type": "Type III",
  "conditions": ["Hypertension"],
  "active_allergies": ["Pollen"],
  "settings": {
    "notifications_enabled": true,
    "dark_mode": true,
    "language": "ar"
  }
}
```

---

## 🩺 3. تشخيص الأمراض الجلدية (Diagnosis & AI Scan Domain)

### 3.1 معالجة صورة وفحص بالذكاء الاصطناعي (Process Scan)
- **Endpoint:** `POST /api/v1/diagnoses/process`
- **Headers:** `Authorization: Bearer <TOKEN>`, `Content-Type: multipart/form-data`
- **Form Data:**
  - `file`: (File - **مطلوب**) صورة المرض الجلدي (الامتدادات: `jpeg`, `png`, `jpg`, `webp` | الحد الأقصى: 10MB).
  - `tta`: (Boolean - **اختياري**) تفعيل Test-Time Augmentation (افتراضي: `true`).

- **Response (201 Created):**
```json
{
  "success": true,
  "message": "Skin image processed and diagnosed successfully via Dr. Hakeem AI model",
  "data": {
    "id": 12,
    "user_id": 1,
    "patient_id_code": "PAT-A8F2K1",
    "image_url": "http://localhost:8000/storage/diagnoses/sample.png",
    "predicted_class": "nv",
    "predicted_label": "Melanocytic nevi",
    "label_ar": "وحمات صبغية (شامة)",
    "is_malignant": false,
    "confidence": 0.989399,
    "confidence_percentage": "98.94%",
    "risk_level": "low",
    "risk_level_label": "منخفض الخطورة",
    "badge_color": "green",
    "inference_time_ms": 141.29,
    "severity_analysis": {
      "risk_level": "low",
      "risk_label_ar": "منخفض الخطورة",
      "badge_color": "green",
      "is_malignant": false,
      "recommendation_ar": "النتيجة تشير إلى آفة حميدة غالباً (وحمات صبغية (شامة)). يُنصح بمراقبة أي تغيرات في الشكل أو اللون وتطبيق واقي الشمس بصورة منتظمة.",
      "recommendation_en": "Low risk lesion detected (Melanocytic nevi). Routine monitoring and general skin protection are advised.",
      "confidence_score": 0.989399,
      "inference_time_ms": 141.29
    },
    "status": "completed",
    "top_3": [
      { "class": "nv", "label": "Melanocytic nevi", "confidence": 0.989399 },
      { "class": "mel", "label": "Melanoma", "confidence": 0.003657 },
      { "class": "bcc", "label": "Basal cell carcinoma", "confidence": 0.002652 }
    ],
    "created_at": "2026-08-20T02:00:00.000000Z"
  }
}
```

---

### 3.2 توليد الخريطة الحرارية الموضعية وخريطة المرض (Heatmap Overlay / Explain)
- **Endpoint:** `POST /api/v1/diagnoses/explain` (أو `POST /api/v1/scans/explain`)
- **Headers:** `Authorization: Bearer <TOKEN>`, `Content-Type: multipart/form-data`
- **Form Data:**
  - `file`: (File - **مطلوب**) صورة المرض الجلدي (`jpeg`, `png`, `jpg`, `webp` | الحد الأقصى: 10MB).
  - `alpha`: (Float - **اختياري**) معامل شفافية الخريطة الحرارية (من `0.0` إلى `1.0` | افتراضي: `0.45`).

- **الوصف والفوائد للموبايل:**
  يقوم هذا الـ Endpoint بإرسال الصورة لنموذج التفسير وتوليد صورة شفافة (Heatmap Overlay) تمكّن مطور الموبايل من عرض موقع المرض والآفة الجلدية بالضبط على الصورة الأصلية. يتم فك تشفير الـ Base64 تلقائياً على السيرفر وتخزينه كملف PNG، ويتم إرجاع رابط مباشر خفيف `heatmap_url` لتسهيل التحميل والعرض على التطبيق دون استهلاك الذاكرة.

- **Response (201 Created):**
```json
{
  "success": true,
  "message": "Skin image processed and heatmap overlay generated successfully via Dr. Hakeem AI model",
  "data": {
    "id": 15,
    "user_id": 1,
    "patient_id_code": "PAT-A8F2K1",
    "image_url": "http://localhost:8000/storage/diagnoses/original.png",
    "heatmap_url": "http://localhost:8000/storage/diagnoses/heatmaps/8a72b12c-49f3.png",
    "predicted_class": "nv",
    "predicted_label": "Melanocytic nevi",
    "explained_class": "nv",
    "explained_label": "Melanocytic nevi",
    "explained_class_confidence": 0.989888,
    "label_ar": "وحمات صبغية (شامة)",
    "is_malignant": false,
    "confidence": 0.989888,
    "confidence_percentage": "98.99%",
    "risk_level": "low",
    "risk_level_label": "منخفض الخطورة",
    "badge_color": "green",
    "inference_time_ms": 145.10,
    "severity_analysis": {
      "risk_level": "low",
      "risk_label_ar": "منخفض الخطورة",
      "badge_color": "green",
      "is_malignant": false,
      "recommendation_ar": "النتيجة تشير إلى آفة حميدة غالباً (وحمات صبغية (شامة)). يُنصح بمراقبة أي تغيرات في الشكل أو اللون وتطبيق واقي الشمس بصورة منتظمة.",
      "recommendation_en": "Low risk lesion detected (Melanocytic nevi). Routine monitoring and general skin protection are advised.",
      "confidence_score": 0.989888,
      "overlay_alpha": 0.45
    },
    "alpha": 0.45,
    "status": "completed",
    "top_predictions": [
      { "class": "nv", "label": "Melanocytic nevi", "confidence": 0.989888 },
      { "class": "mel", "label": "Melanoma", "confidence": 0.003408 },
      { "class": "bcc", "label": "Basal cell carcinoma", "confidence": 0.002603 }
    ],
    "created_at": "2026-08-26T17:40:00.000000Z"
  }
}
```

---

### 3.3 عرض سجل الفحوصات التاريخية (Diagnosis History)
- **Endpoint:** `GET /api/v1/diagnoses/history`
- **Query Params:** `status`, `predicted_class`, `per_page`

---

### 3.4 تفاصيل فحص واحد (Get Scan Details)
- **Endpoint:** `GET /api/v1/diagnoses/{id}`

---

## 📊 4. إحصائيات لوحة التحكم (Dashboard Domain)

### 4.1 جلب إحصائيات النظام ولوحة التحكم (Dashboard Stats)
- **Endpoint:** `GET /api/v1/dashboard/stats`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "إحصائيات لوحة التحكم لموديل دكتور حكيم",
  "data": {
    "total_scans": 45,
    "completed_scans": 42,
    "failed_scans": 3,
    "high_risk_scans": 5,
    "growth_rate": 15.5,
    "accuracy_metrics": {
      "average_confidence": 0.9654,
      "average_confidence_percentage": "96.54%",
      "average_inference_time_ms": 138.45
    },
    "disease_distribution": [
      { "class": "akiec", "label_ar": "التقان السعفي", "is_malignant": true, "count": 2 },
      { "class": "bcc", "label_ar": "سرطان الخلايا القاعدية", "is_malignant": true, "count": 3 },
      { "class": "bkl", "label_ar": "آفات التقرن الحميدة", "is_malignant": false, "count": 10 },
      { "class": "nv", "label_ar": "وحمات صبغية (شامة)", "is_malignant": false, "count": 27 },
      { "class": "mel", "label_ar": "ورم قتامي (ميلانوما)", "is_malignant": true, "count": 0 }
    ],
    "recent_scans": []
  }
}
```

---

## ⚠️ 5. مستويات الخطورة (`RiskLevel`)
- `low`: منخفض الخطورة (عادة حالات حميدة `nv` أو `bkl`).
- `moderate`: متوسط الخطورة (يتطلب مراجعة استشارية).
- `high`: عالي الخطورة (سرطاني محتمل مثل `bcc` أو `akiec`).
- `critical`: حرج جداً (سرطاني مؤكد بنسبة عالية مثل `mel` أو `bcc` بنسبة تأكد مرتفعة).
