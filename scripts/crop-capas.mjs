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

const OUT_W = 640; // sem recorte -- mantem a proporcao original de cada capa na totalidade

for (const { src, out } of FILES) {
  const inputPath = path.join(SRC_DIR, src);
  const meta = await sharp(inputPath).metadata();
  const outH = Math.round((meta.height / meta.width) * OUT_W);
  await sharp(inputPath)
    .resize(OUT_W, outH, { fit: "fill" })
    .jpeg({ quality: 85 })
    .toFile(path.join(OUT_DIR, out));
  console.log(`OK ${src} (${meta.width}x${meta.height}) -> ${out} (${OUT_W}x${outH}, sem recorte)`);
}
