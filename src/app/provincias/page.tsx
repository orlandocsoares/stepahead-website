import { redirect } from "next/navigation";

export default function ProvinciasRedirect() {
  redirect("/preview?phase=2");
}
