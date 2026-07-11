import { redirect } from "next/navigation";

export default function AgendaPublicaRedirect() {
  redirect("/preview?phase=6");
}
