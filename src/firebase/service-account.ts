
// ------------------------------------------------------------------
// LÜTFEN BU DOSYAYI GÜNCELLEYİN!
// Bu dosya, sunucu tarafındaki Firebase işlemlerinin çalışması için
// kritik öneme sahiptir. Lütfen aşağıdaki yer tutucu değerleri,
// Firebase projenizin "Project settings" > "Service accounts"
// bölümünden oluşturduğunuz yeni bir özel anahtar (private key)
// ile aldığınız gerçek değerlerle değiştirin.
//
// ÖNEMLİ: private_key değerini tırnak işaretleri de dahil olmak
// üzere tam olarak kopyaladığınızdan emin olun.
// ------------------------------------------------------------------

export const serviceAccount = {
  "type": "service_account",
  "project_id": "YOUR_PROJECT_ID", // BURAYI DEĞİŞTİRİN
  "private_key_id": "YOUR_PRIVATE_KEY_ID", // BURAYI DEĞİŞTİRİN
  "private_key": `-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_CONTENT\n-----END PRIVATE KEY-----\n`, // BURAYI DEĞİŞTİRİN
  "client_email": "YOUR_CLIENT_EMAIL", // BURAYI DEĞİŞTİRİN
  "client_id": "YOUR_CLIENT_ID", // BURAYI DEĞİŞTİRİN
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "YOUR_CLIENT_X509_CERT_URL" // BURAYI DEĞİŞTİRİN
};
