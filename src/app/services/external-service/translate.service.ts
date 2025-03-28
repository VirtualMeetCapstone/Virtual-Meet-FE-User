import axios from 'axios';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TranslateService {
  private apiUrl = 'https://deep-translate1.p.rapidapi.com/language/translate/v2';
  private apiKey = '6d14c0f62cmsha0723917ffaab3fp14812djsn2d0cdf97d701';

  async translate(text: string, sourceLang: string, targetLang: string): Promise<string> {
    try {
      console.log("📝 Đang gửi văn bản:", text);
      console.log("🌍 Dịch từ:", sourceLang, "->", targetLang);

      const response = await axios.post(
        this.apiUrl,
        {
          q: text,
          source: sourceLang,
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

      console.log("📥 Phản hồi từ API:", response);

      if (response.data && response.data.data && response.data.data.translations) {
        console.log("✅ Văn bản đã dịch:", response.data.data.translations.translatedText);
        return response.data.data.translations.translatedText;
      } else {
        console.error("⚠️ API lỗi chi tiết:", JSON.stringify(response.data, null, 2));

        console.error("⚠️ API trả về dữ liệu không đúng định dạng:", response.data);
        return "Lỗi: API không trả về dữ liệu hợp lệ.";
      }

    } catch (error) {
      console.error('❌ Lỗi dịch:', error);
      return 'Không thể dịch';
    }
}


}
