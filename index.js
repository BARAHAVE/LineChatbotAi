const { onRequest } = require("firebase-functions/v2/https");
const line = require("./utils/line");
const gemini = require("./utils/gemini");
const axios = require("axios");

exports.webhook = onRequest(async (req, res) => {
  if (req.method === "POST") {
    const events = req.body.events;
    for (const event of events) {
      try {
        switch (event.type) {
          case "message":
   
            
            if (event.message.type === "text") {
              console.log(event.message.text);
              const msg = await gemini.chat(event.message.text);
              await line.reply(event.replyToken, [{ type: "text", text: msg }]);
            }
            
            
            else if (event.message.type === "image") {
              const imageBinary = await line.getImageBinary(event.message.id);
              const msg = await gemini.multimodal(imageBinary);
              await line.reply(event.replyToken, [{ type: "text", text: msg }]);
            } else {
              await line.reply(event.replyToken, [{ type: "text", text: "ขออภัยครับผมไม่สามารถตอบได้โปรดพิมพ์คำถามเดิมให้ละเอียดมากขึ้นหรือพิมพ์คำถามใหม่" }]);
            }

            break;
            
        }
      } catch (error) {
        if (error.response && error.response.promptFeedback && error.response.promptFeedback.blockReason === 'SAFETY') {
          // Handle safety block
          await line.reply(event.replyToken, [{ type: "text", text: "ขออภัยครับผมไม่สามารถตอบได้เนื่องจากปัญหาด้านความปลอดภัย" }]);
          
        } //else if (error instanceof axios.AxiosError && error.response && error.response.status === 400) {
          // Handle 400 Bad Request error
          //await line.reply(event.replyToken, [{ type: "text", text: "ขออภัยครับผมไม่สามารถดำเนินการตามคำขอของคุณ" }]);}
           else {
          // Handle other errors
          console.error("Error:", error);
          await line.reply(event.replyToken, [{ type: "text", text: "ขออภัยครับผมเกิดข้อผิดพลาดโปรดพิมพ์คำถามเดิมให้ละเอียดมากขึ้นหรือพิมพ์คำถามใหม่" }]);
        }
      }
    }
    return res.status(200).end();
  } else {
    return res.status(400).end();
  }
});

