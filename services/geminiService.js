import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../utils/logger.js';
import { config } from '../config/constants.js';

class GeminiService {
    constructor() {
        this.genAI = null;
        this.model = null;
    }

    initialize() {
        if (!config.gemini.apiKey) {
            throw new Error('Gemini API Key missing');
        }
        this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
        // Using 'gemini-1.5-flash' for speed/efficiency, or 'gemini-1.5-pro' for quality
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        logger.info('Gemini AI initialized');
    }

    async generateDescription(imageBuffer, mimeType = 'image/jpeg') {
        try {
            if (!this.model) this.initialize();

            const prompt = `You are a professional Real Estate marketing expert for Team 25, a top property sales company in India.

Analyze this Real Estate marketing image carefully and generate a WhatsApp-ready promotional message.

IMPORTANT INSTRUCTIONS:
1. READ the image carefully - extract ALL text visible (price, location, project name, features, contact info).
2. DO NOT make up information. Only use what's visible in the image.
3. If price is visible (like "₹549 per sqft"), include it exactly as shown.
4. If location is visible, include it exactly.
5. List features as bullet points with emojis.

OUTPUT FORMAT (follow this exactly):
[Catchy Headline based on image content]

🏡 [Property Type] @ ₹[Price if visible]
📍 [Location if visible]

• [Feature 1 from image]
• [Feature 2 from image]
• [Feature 3 from image]
• [More features...]

📞 Call Now for more details

RULES:
- Keep it clean and professional
- Use emojis sparingly but effectively
- If you can't read text clearly, describe what you see
- DO NOT add fake prices or locations
- Language: Primarily English with some Hindi if appropriate`;

            const imagePart = {
                inlineData: {
                    data: imageBuffer.toString('base64'),
                    mimeType
                },
            };

            const result = await this.model.generateContent([prompt, imagePart]);
            const response = await result.response;
            const text = response.text();

            logger.info('Caption generated successfully');
            return text;

        } catch (error) {
            logger.error(`Gemini Generation Error: ${error.message}`);
            // Fallback caption if AI fails
            return `🏡 Premium Property Available!

📍 Prime Location
• Quality Construction
• Great Investment Opportunity

📞 Call Now for more details`;
        }
    }
    async generateMorningGreeting(dateOverride = null) {
        try {
            if (!this.model) this.initialize();

            const now = dateOverride || new Date();
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayName = days[now.getDay()];
            const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

            let prompt = "";

            if (dayName === 'Sunday') {
                // Special Sunday Prompt
                prompt = `You are the enthusiastic Team Leader of 'Team 25', a top Real Estate company.
                Generate a special "Sunday Morning" motivation message for your team.
                
                Context:
                - Sunday is the MOST important day in Real Estate (Site Visits & Closings).
                - Date: ${dateStr} | ${dayName}
                
                Requirements:
                - Tone: High Energy, Appreciative, and Creative.
                - Language: Hinglish (Natural Mix of Hindi & English).
                - Content: Mention that today is the day for maximum site visits and closings. Use phrases like "Power up Team 25", "Aaj macha denge", "Review day results".
                - format:
                  📅 ${dateStr} | ${dayName}
                  
                  "Quotes..."
                  
                  [Main Body]
                `;
            } else {
                // Weekday Prompt
                prompt = `You are the specific Team Leader of 'Team 25', a Real Estate sales team.
                Generate a morning motivational message.
                
                Context:
                - Date: ${dateStr} | ${dayName}
                - Focus: Sales, Follow-ups, Hustle, Discipline.
                
                Requirements:
                - Tone: Professional yet Warm and Motivating.
                - Language: Mix of English and Hindi (Hinglish).
                - Variety: Ensure the message is FRESH and UNIQUE every day. Do not repeat generic phrases.
                - Quote: Include a short powerful quote about Success/Sales/Hard work.
                - Format:
                  📅 ${dateStr} | ${dayName}
                  
                  "[Quote]"
                  
                  Good Morning Team 25! ☀️
                  [One line motivation] 🏡🚀
                `;
            }

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text();

        } catch (error) {
            logger.error(`Gemini Greeting Error: ${error.message}`);

            // Rich Fallbacks (when AI fails)
            const quotes = [
                "Success usually comes to those who are too busy to be looking for it.",
                "The road to success and the road to failure are almost exactly the same.",
                "Opportunities don't happen. You create them.",
                "Don't watch the clock; do what it does. Keep going.",
                "The secret of getting ahead is getting started.",
                "Quality means doing it right when no one is looking.",
                "It always seems impossible until it is done.",
                "Keep your face always toward the sunshine—and shadows will fall behind you."
            ];

            const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
            const now = new Date();
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            // Handle override passed via argument, or fallback to now
            const currentDayIndex = dateOverride ? dateOverride.getDay() : now.getDay();
            const dayName = days[currentDayIndex];

            if (dayName === 'Sunday') {
                return `📅 ${now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} | Sunday Special
            
"Review, Reflect, and Recharge."

Good Morning Team 25! ☀️
Today is the day for site visits and closings. Power up! 🏡💪`;
            }

            return `📅 ${now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} | ${dayName}
            
"${randomQuote}"

Good Morning Team 25! ☀️
Let's crush our targets today! 🏡🚀`;
        }
    }
}

export default new GeminiService();
