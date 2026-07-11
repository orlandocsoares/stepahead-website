import { redirect } from "next/navigation";

export default function FormadoresRedirect() {
  redirect("/preview?phase=3");
}
