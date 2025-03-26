import axios from 'axios';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TranslateService {
  private apiUrl = 'https://deep-translate1.p.rapidapi.com/language/translate/v2';
  private apiKey = '6d14c0f62cmsha0723917ffaab3fp14812djsn2d0cdf97d701'; // Thay API Key của bạn vào đây

  async translate(text: string, targetLang: string = 'en'): Promise<string> {
    try {
      console.log("📝 Đang gửi văn bản:", text);

      const response = await axios.post(
        this.apiUrl,
        {
          q: text,
          source: 'vi',
          target: targetLang,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-RapidAPI-Key': this.apiKey,
            'X-RapidAPI-Host': 'deep-translate1.p.rapidapi.com',
          },
        }
      );

      console.log("📥 Phản hồi từ API:", response.data);

      // Kiểm tra response có đúng không
      if (response.data && response.data.data && response.data.data.translations) {
        return response.data.data.translations.translatedText;
      } else {
        console.error("⚠️ API trả về dữ liệu không đúng định dạng:", response.data);
        return "Lỗi: API không trả về dữ liệu hợp lệ.";
      }

    } catch (error) {
      console.error('❌ Lỗi dịch:', error);
      return 'Không thể dịch';
    }
  }

}
