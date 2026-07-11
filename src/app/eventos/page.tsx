import { redirect } from "next/navigation";

export default function EventosRedirect() {
  redirect("/preview?phase=5");
}
