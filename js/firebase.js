// تهيئة Firebase للتعامل مع Firestore
// هذا الملف يفترض وجود firebase-app-compat و firebase-firestore-compat في الـ HTML

// ملاحظة: استخدم نفس البيانات المستخدمة في مشروعك الحالي
const firebaseConfig = {
  apiKey: "AIzaSyAiidqHba1MY8D_AnbOv3DWSOjaeGXwB7A",
  authDomain: "adlatex-fabric-tracking.firebaseapp.com",
  projectId: "adlatex-fabric-tracking",
  storageBucket: "adlatex-fabric-tracking.firebasestorage.app",
  messagingSenderId: "448342410940",
  appId: "1:448342410940:web:06d676113caad3d82d72b9"
};

firebase.initializeApp(firebaseConfig);

// قاعدة البيانات متاحة عالمياً
window.db = firebase.firestore();
window.FieldValue = firebase.firestore.FieldValue;
