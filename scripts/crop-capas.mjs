import sharp from "sharp";
import path from "path";

const SRC_DIR = "F:/sabermais.edu.ao/temp files/capas";
const OUT_DIR = "F:/sabermais.edu.ao/public/capas";

const FILES = [
  { src: "Matemática.png", out: "matematica.jpg" },
  { src: "Capa LP.png", out: "lingua-portuguesa.jpg" },
  { src: "Ed. Especial.png", out: "educacao-especial.jpg" },
  { src: "Ed. pré-Escolar.png", out: "educacao-pre-escolar.jpg" },
  { src: "Exp. Motora 1.png", out: "expressao-motora.jpg" },
  { src: "Exp. Plástica.png", out: "expressao-plastica.jpg" },
  { src: "Layout Branco Para Outras Areas.png", out: "geral.jpg" },
];

// Todas as capas saem com o MESMO tamanho (640x905), para a caixa na grelha
// (que usa esse aspect-ratio) ficar sempre preenchida sem cortar nada.
// fit:"contain" nunca corta -- so acrescenta fundo branco se a proporcao
// original nao bater certo exactamente.
const OUT_W = 640;
const OUT_H = 905;

for (const { src, out } of FILES) {
  const inputPath = path.join(SRC_DIR, src);
  const meta = await sharp(inputPath).metadata();
  await sharp(inputPath)
    .resize(OUT_W, OUT_H, { fit: "contain", background: "#ffffff" })
    .jpeg({ quality: 85 })
    .toFile(path.join(OUT_DIR, out));
  console.log(`OK ${src} (${meta.width}x${meta.height}) -> ${out} (${OUT_W}x${OUT_H}, sem recorte)`);
}
