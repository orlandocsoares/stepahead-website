import { redirect } from "next/navigation";

export default function SaberMaisRedirect() {
  redirect("/preview?phase=1");
}
