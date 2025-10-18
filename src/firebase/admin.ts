
import * as admin from 'firebase-admin';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getStorage, Storage } from 'firebase-admin/storage';

const serviceAccount = {
  "type": "service_account",
  "project_id": "bematch-new",
  "private_key_id": "bbb352263ad0285352972d472fe474ab26466962",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDKFIaWqJ4X9In+\nltEAjOTDXCANjXpfge4+xI4hSjxpFsViM71NMEbxhW+HE+eMf6eiuDsp4Pfn1CCD\nHr1jwmeIH0yAGkPPhzq81QGHylUvwyUVOirOT85Tm8c8tTtCiNXjVu/90vrlutLx\nF1+F2nw3X84ihpIM28/c9bPAv4IZU6GYgfNUiJb299Bir1Opukcg5OTNfdZQpycr\neQ3qvKqDhMjX0oNBmfJ0uZD/bZvAFP7ex2y3MG2qpybjEj0WXoVCgNaLD85hrobk\np4TMs5Jla3p4nd8zEbp4tIiNN9VWB0DiNhPJTOoPcFr0Ige2z63LIfBbSPpnuvby\nzys34aDNAgMBAAECggEAE+DUg3X3RT58I5PU3+O8Lh5+Fa802jfHBpwhqhMqIaFI\njdoulSz6UZBRcf1qgdbd1+MdCMfVQxQKFbPcp/dL5WdEyHYs9PlltQUUBzZHTnE5\nEN89rjlJ/837WZSvTWJ1/czDw1lxbk9EKEynDBz7qpvNRHat379wsVjnE38TLmfv\ni8RltnVJIIAuWUUs7TFXh9MY6i7k/1lG6A0XvQTT5zOP7IXAInTz2T/blPOQgZq1\n6Uk2LXi1eeSj4+0Y0rEvYC32ziCd2rTkuYadVR8R49Zr6pqAFoV87QQ2PGJK3zOb\nhTGJlSSy3J3ySW66RRuIM/38kSnUYgKGBXmxBFM6WQKBgQDzcw+N057S2S8bOhxQ\ngXQwNkT9oGuAm3y7UWFxIT/Bknj8HjyyWP4lN4uwRLA0Dkjk7Kqj+2rTmwaaDTgq\n20h78XCQ7sOWEYOVuh0djgo7cfNXQz8B6ep6j6yFr2zEfbyUNhWijgKndP7zIejF\nEm57oYH27yQuXjHQLmMQXI9ByQKBgQDUf33LRqOON/XiOKVZuu6Huc5dM+Oyv5GY\n8H+kFtmlSN2xBh6C4VurAEGH8hRrzsbjiInokEtEe2pGd3tQPH7WkBRkdiZHIclg\nopmeKgav9GFS8uEsw6pVj9tvy/37zwzOu0YWFxLJAkWwUQRUMMWmVUIya4rR5p1V\nMC/EFwGI5QKBgQCzc+xSOl0HxYpgwowel95Cr65ZWsgDrBncpldyofSyRrsh9VP+\nj3T/kBtLGsbcCG+ZOA9tAyYyx0KtifMOPEgI/OdiHm5UD6L0WpWdtJc8THn4qBwo\n1/m80G12ueIuURUSF3AJPC8eqzJHnIZNxpFkVqBLmuoLt+l2MMtbQy9iaQKBgC8u\n/+ebD8YMdvR8T3rVHxHUGBZp5y1RjCrBfBYbXMhunYspKK03DPuzWtmszwwBJfhv\n4O9a2tuh678p2J/ATwmlhGGqOmWhAu4KLMIJ4uI/CT054PXnnHLTNo5kZUj8eIOO\n4ckV5n3rmz3DP4rSKZD9bW10o6Zn5pd7059e3GBhAoGBAMrKh3V1mIrkeKq8TDiK\nqjRmvseBXU25xAE36ifAmOI2Po7PdijtqmqAytsSo2OyvmnSfyG10X7JBr/STjKb\nICCj5PtfPnsJY1ZQJnIZIdIz0D72LHSWuX4l6Fexd9MIfAXFb050BROeiPqygggm\n+nHXCn/i2XbIuqprR7NVIN/i\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@bematch-new.iam.gserviceaccount.com",
  "client_id": "112694597922821600578",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40bematch-new.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: `${serviceAccount.project_id}.appspot.com`
    });
  } catch (e) {
    console.error('Firebase Admin SDK Initialization Error', e);
  }
}

const db: Firestore = getFirestore();
const auth: Auth = getAuth();
const storage: Storage = getStorage();

export { admin, db, auth, storage };
