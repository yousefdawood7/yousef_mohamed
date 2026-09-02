# ⚛️ دليل ربط الفرونت إند (React Integration Guide) - Dr. Hakeem API

دليل برمجي شامل وعملي لمطوري الويب باستخدام **React.js** (سواء React SPA أو Next.js) يتضمن أكواداً جاهزة للنسخ والاستخدام لتسريع عملية الربط مع خلفية نظام **دكتور حكيم (Dr. Hakeem API)**.

---

## 🚀 1. إعداد Axios Client ومُعالج التوكن التلقائي (`src/services/api.js`)

أنشئ ملف `src/services/api.js` ليدير الاتصال التلقائي ويدرج الـ Bearer Token في كل Request:

```javascript
import axios from 'axios';

// 1. إنشاء كائن Axios بـ Base URL الخاص بالنظام
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Accept': 'application/json',
  },
});

// 2. Request Interceptor: إضافة التوكن تلقائياً لجميع الطلبات
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('dr_hakeem_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 3. Response Interceptor: التعامل مع انتهاء صلاحية الجلسة (401 Unauthorized)
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('dr_hakeem_token');
      // تحويل المستخدم لصفحة تسجيل الدخول إذا لزم الأمر
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error.response ? error.response.data : error);
  }
);

export default api;
```

---

## 🔐 2. مدير المصادقة والجلسات (`src/context/AuthContext.jsx`)

كود جاهز لـ React Context يُدير تسجيل الدخول والتسجيل وتحديث ملف المريض:

```jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

publicProvider:
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [patientProfile, setPatientProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // جلب بيانات المستخدم عند تحميل الصفحة أول مرة
  useEffect(() => {
    const token = localStorage.getItem('dr_hakeem_token');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/patient/profile');
      setPatientProfile(res.data);
      setUser(res.data.user || null);
    } catch (err) {
      console.error('Failed to fetch profile', err);
    } finally {
      setLoading(false);
    }
  };

  // تسجيل حساب جديد
  const register = async (name, email, password, passwordConfirmation) => {
    const res = await api.post('/auth/register', {
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
      role: 'patient',
    });
    const { token, user: userData } = res.data;
    localStorage.setItem('dr_hakeem_token', token);
    setUser(userData);
    setPatientProfile(userData.patient_profile);
    return res;
  };

  // تسجيل الدخول
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('dr_hakeem_token', token);
    setUser(userData);
    setPatientProfile(userData.patient_profile);
    return res;
  };

  // تحديث إعدادات المريض
  const updateSettings = async (settingsPayload) => {
    const res = await api.put('/patient/settings', settingsPayload);
    setPatientProfile(res.data);
    return res;
  };

  // تسجيل الخروج
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore
    } finally {
      localStorage.removeItem('dr_hakeem_token');
      setUser(null);
      setPatientProfile(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        patientProfile,
        loading,
        login,
        register,
        logout,
        updateSettings,
        fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

---

## 🩺 3. المكون البرمجي لرفع صورة الفحص بالذكاء الاصطناعي (`src/components/SkinScanUpload.jsx`)

مكون جاهز بالكامل يتضمن: رفع الصورة، شريط تقدم الرفع (Upload Progress)، شارة الخطورة (Risk Badge)، نسبة التنسيق، وقائمة الاحتمالات الثلاثة الأولى:

```jsx
import React, { useState } from 'react';
import api from '../services/api';

export default function SkinScanUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // اختيار الصورة ومعاينتها
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  // إرسال طلب الفحص لالـ API
  const handleUploadAndDiagnose = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('tta', 'true');

    setLoading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const response = await api.post('/diagnoses/process', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });

      setResult(response.data);
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء فحص الصورة بالذكاء الاصطناعي');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto', fontFamily: 'sans-serif', direction: 'rtl' }}>
      <h2>🩺 فحص تشخيص الأمراض الجلدية بالذكاء الاصطناعي</h2>

      {/* منطقة اختيار الملف والمعاينة */}
      <div style={{ border: '2px dashed #ccc', padding: '20px', textAlign: 'center', borderRadius: '8px' }}>
        <input type="file" accept="image/*" onChange={handleFileChange} id="skin-input" hidden />
        <label htmlFor="skin-input" style={{ cursor: 'pointer', background: '#007bff', color: '#fff', padding: '10px 20px', borderRadius: '4px' }}>
          اختر صورة العينة الجلدية
        </label>

        {previewUrl && (
          <div style={{ marginTop: '15px' }}>
            <img src={previewUrl} alt="معاينة" style={{ maxHeight: '200px', borderRadius: '8px' }} />
          </div>
        )}
      </div>

      {/* زر الرفع والفحص */}
      {selectedFile && (
        <button
          onClick={handleUploadAndDiagnose}
          disabled={loading}
          style={{ width: '100%', marginTop: '15px', padding: '12px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer' }}
        >
          {loading ? `جاري الفحص المعالج (${uploadProgress}%)...` : 'بدء الفحص بالذكاء الاصطناعي'}
        </button>
      )}

      {/* رسالة الخطأ */}
      {error && <div style={{ background: '#f8d7da', color: '#721c24', padding: '12px', marginTop: '15px', borderRadius: '4px' }}>{error}</div>}

      {/* عرض نتائج التشخيص */}
      {result && (
        <div style={{ marginTop: '20px', border: '1px solid #ddd', padding: '20px', borderRadius: '8px', background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>النتيجة التشخيصية: {result.label_ar} ({result.predicted_label})</h3>
            <span style={{
              padding: '6px 12px',
              borderRadius: '20px',
              color: '#fff',
              fontWeight: 'bold',
              backgroundColor: result.is_malignant ? '#dc3545' : '#28a745'
            }}>
              {result.risk_level_label}
            </span>
          </div>

          {/* نسبة التأكد */}
          <div style={{ marginTop: '10px' }}>
            <strong>نسبة تأكد الموديل: {result.confidence_percentage}</strong>
            <div style={{ background: '#e9ecef', height: '10px', borderRadius: '5px', marginTop: '5px', overflow: 'hidden' }}>
              <div style={{ width: result.confidence_percentage, height: '100%', background: result.is_malignant ? '#dc3545' : '#28a745' }}></div>
            </div>
          </div>

          {/* التوصيات الطبية */}
          {result.severity_analysis && (
            <div style={{ marginTop: '15px', padding: '12px', background: result.is_malignant ? '#fff3cd' : '#e2e3e5', borderRadius: '4px' }}>
              <strong>💡 التوصية الطبية:</strong>
              <p style={{ margin: '5px 0 0 0' }}>{result.severity_analysis.recommendation_ar}</p>
            </div>
          )}

          {/* أعلى 3 احتمالات بديلة (Top 3 Differential Diagnoses) */}
          {result.top_3 && result.top_3.length > 0 && (
            <div style={{ marginTop: '15px' }}>
              <h4>الاحتمالات البديلة (Top 3 Predictions):</h4>
              <ul>
                {result.top_3.map((item, idx) => (
                  <li key={idx}>
                    {item.label} ({item.class}): {Math.round(item.confidence * 100)}%
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## 🎨 4. مكون عرض الخريطة الحرارية المحددة لموقع المرض (`src/components/SkinScanExplain.jsx`)

مكون React احترافي يعرض صورة المرض الأصلية وتحتها طبقة الـ **Heatmap Overlay** مع متحكم شفافية اسليدر (Opacity Slider) لعرض مكان الإصابة الجلدية بدقة:

```jsx
import React, { useState } from 'react';
import api from '../services/api';

export default function SkinScanExplain() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [alpha, setAlpha] = useState(0.45);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('alpha', alpha.toString());

    setLoading(true);
    try {
      const response = await api.post('/diagnoses/explain', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(response.data);
    } catch (err) {
      alert('فشل توليد الخريطة الحرارية: ' + (err.message || 'خطأ في السيرفر'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '650px', margin: '20px auto', fontFamily: 'sans-serif', direction: 'rtl' }}>
      <h2>🔥 خريطة تظليل وتحديد موقع المرض الجلدي (Heatmap Overlay)</h2>

      <input type="file" accept="image/*" onChange={(e) => {
        const file = e.target.files[0];
        if (file) {
          setSelectedFile(file);
          setPreviewUrl(URL.createObjectURL(file));
        }
      }} />

      <div style={{ marginTop: '10px' }}>
        <label>شفافية التظليل (Alpha): {alpha}</label>
        <input
          type="range"
          min="0.1"
          max="1.0"
          step="0.05"
          value={alpha}
          onChange={(e) => setAlpha(parseFloat(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      <button onClick={handleUpload} disabled={loading} style={{ marginTop: '10px', padding: '10px 20px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px' }}>
        {loading ? 'جاري التحليل والتظليل...' : 'عرض خريطة المرض الموضعية'}
      </button>

      {/* عرض الخريطة الحرارية المتراكبة (Heatmap Overlay Stack) */}
      {result && result.heatmap_url && (
        <div style={{ marginTop: '20px' }}>
          <h3>موقع الإصابة الجلدية بالضبط:</h3>
          <div style={{ position: 'relative', width: '100%', maxWidth: '500px', height: '400px', margin: '0 auto', border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
            {/* الصورة الأصلية */}
            <img src={result.image_url} alt="Original Skin" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            {/* طبقة الـ Heatmap فوق الصورة الأصلية */}
            <img src={result.heatmap_url} alt="Heatmap Overlay" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: alpha, transition: 'opacity 0.2s' }} />
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 📊 4. عرض إحصائيات لوحة التحكم (`src/components/DashboardStats.jsx`)

```jsx
import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function DashboardStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then((res) => setStats(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>جاري تحميل إحصائيات النظام...</div>;
  if (!stats) return <div>تعذر جلب البيانات</div>;

  return (
    <div style={{ padding: '20px', direction: 'rtl' }}>
      <h2>📊 لوحة تحكم دكتور حكيم</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginTop: '15px' }}>
        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
          <h4>إجمالي الفحوصات</h4>
          <h2>{stats.total_scans}</h2>
        </div>
        <div style={{ background: '#e8f5e9', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
          <h4>الفحوصات الناجحة</h4>
          <h2>{stats.completed_scans}</h2>
        </div>
        <div style={{ background: '#ffebee', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
          <h4>الحالات العالية الخطورة</h4>
          <h2 style={{ color: '#d32f2f' }}>{stats.high_risk_scans}</h2>
        </div>
        <div style={{ background: '#e3f2fd', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
          <h4>معدل الدقة المتوسط</h4>
          <h2>{stats.accuracy_metrics.average_confidence_percentage}</h2>
        </div>
      </div>
    </div>
  );
}
```
