import { redirect } from "next/navigation";

export default function AgendaPublicaRedirect() {
  redirect("/?phase=6");
}
