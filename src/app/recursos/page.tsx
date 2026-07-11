import { redirect } from "next/navigation";

export default function RecursosRedirect() {
  redirect("/preview?phase=4");
}
