import messages from "./messages/zh-CN.json";

declare module "next-intl" {
  interface AppConfig {
    Messages: typeof messages;
  }
}
