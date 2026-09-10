import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import { jwt_secret } from "@repo/backend-common/config";
interface MyJwtPayload {
  userId: string;
}

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", function connection(ws, request) {
  try {
    const url = request.url;

    if (!url) {
      ws.close();
      return;
    }

    const queryParams = new URLSearchParams(
      url.split("?")[1] || ""
    );

    const token = queryParams.get("token");

    if (!token) {
      ws.close();
      return;
    }

    const decoded = jwt.verify(
      token,
      jwt_secret
    ) as MyJwtPayload;

    if (!decoded.userId) {
      ws.close();
      return;
    }

    ws.on("message", function message(data) {
      console.log(data.toString());

      ws.send("connect");
    });

  } catch (error) {
    ws.close();
  }
});