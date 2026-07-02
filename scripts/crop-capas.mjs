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

const OUT_W = 640;
const OUT_H = 800; // 4:5 -- mais alto, mostra mais da capa (menos rodape na grelha)

for (const { src, out } of FILES) {
  const inputPath = path.join(SRC_DIR, src);
  const meta = await sharp(inputPath).metadata();
  const w = meta.width;
  const cropH = Math.round((w * OUT_H) / OUT_W);
  await sharp(inputPath)
    .extract({ left: 0, top: 0, width: w, height: Math.min(cropH, meta.height) })
    .resize(OUT_W, OUT_H, { fit: "cover", position: "top" })
    .jpeg({ quality: 85 })
    .toFile(path.join(OUT_DIR, out));
  console.log(`OK ${src} (${w}x${meta.height}) -> ${out} (crop top ${cropH}px)`);
}
