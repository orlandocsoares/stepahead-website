import { redirect } from "next/navigation";

export default function EventosRedirect() {
  redirect("/?phase=5");
}
