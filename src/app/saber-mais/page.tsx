import { redirect } from "next/navigation";

export default function SaberMaisRedirect() {
  redirect("/?phase=1");
}
