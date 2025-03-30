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


      if (response.data && response.data.data && response.data.data.translations) {
        console.log("✅ Văn bản đã dịch:", response.data.data.translations.translatedText);
        return response.data.data.translations.translatedText;
      } else {
        return "Lỗi: API không trả về dữ liệu hợp lệ.";
      }

    } catch (error) {
      return 'Không thể dịch';
    }
}


}
