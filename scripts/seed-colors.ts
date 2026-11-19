import { db } from '@/lib/db'

export const CORES_CATALOGO = [
  // NUDES & CLÁSSICOS
  { nome: 'Renda Delicada', hex: '#FBF7F2', categoria: 'nude' },
  { nome: 'Nude Clássico', hex: '#E8C49A', categoria: 'nude' },
  { nome: 'Baunilha Suave', hex: '#F5EDE0', categoria: 'nude' },
  { nome: 'Cappuccino Cremoso', hex: '#C49E78', categoria: 'nude' },
  { nome: 'Areia Quente', hex: '#DFC29C', categoria: 'nude' },
  { nome: 'Amêndoa Chic', hex: '#D8B58F', categoria: 'nude' },
  { nome: 'Doce de Leite', hex: '#C69261', categoria: 'nude' },

  // ROSAS & GLAMOUR
  { nome: 'Dusty Rose', hex: '#F7A6B7', categoria: 'rosa' },
  { nome: 'Rosa Quartzo', hex: '#FAD1DA', categoria: 'rosa' },
  { nome: 'Blush Princesa', hex: '#FFD6DE', categoria: 'rosa' },
  { nome: 'Pink Glamour', hex: '#E85D88', categoria: 'rosa' },
  { nome: 'Chiclete Pop', hex: '#FF8DA1', categoria: 'rosa' },
  { nome: 'Rosa Queimado', hex: '#C86D7E', categoria: 'rosa' },
  { nome: 'Malva Romântico', hex: '#B56B86', categoria: 'rosa' },
  { nome: 'Fúcsia Vibrante', hex: '#D6226C', categoria: 'rosa' },

  // VERMELHOS & SENSUAIS
  { nome: 'Vermelho Fatal', hex: '#BA131A', categoria: 'vermelho' },
  { nome: 'Carmim Intenso', hex: '#990000', categoria: 'vermelho' },
  { nome: 'Maçã do Amor', hex: '#D82030', categoria: 'vermelho' },
  { nome: 'Bordô Imperial', hex: '#722F37', categoria: 'vermelho' },
  { nome: 'Vinho Cabernet', hex: '#5A1A2A', categoria: 'vermelho' },
  { nome: 'Marsala Sofisticado', hex: '#682837', categoria: 'vermelho' },
  { nome: 'Jabuticaba Profundo', hex: '#3D0E1E', categoria: 'vermelho' },

  // TONS PASTÉIS & CANDY
  { nome: 'Lilás Lavanda', hex: '#D8BFD8', categoria: 'pastel' },
  { nome: 'Menta Fresca', hex: '#B2E2D2', categoria: 'pastel' },
  { nome: 'Amarelo Manteiga', hex: '#FFF2B2', categoria: 'pastel' },
  { nome: 'Azul Céu Suave', hex: '#B8D8E8', categoria: 'pastel' },
  { nome: 'Pêssego Delicado', hex: '#FFD1BA', categoria: 'pastel' },
  { nome: 'Verde Pistache', hex: '#C8E6C9', categoria: 'pastel' },

  // TERROSOS & OUTONO
  { nome: 'Terracota Quente', hex: '#C86446', categoria: 'terroso' },
  { nome: 'Canela Rústica', hex: '#A0522D', categoria: 'terroso' },
  { nome: 'Caramelo Queimado', hex: '#B87333', categoria: 'terroso' },
  { nome: 'Telha Elegante', hex: '#B2533E', categoria: 'terroso' },
  { nome: 'Mostarda Suave', hex: '#D4A017', categoria: 'terroso' },

  // ESCUROS & URBANOS
  { nome: 'Preto Blackout', hex: '#1C1C1C', categoria: 'escuro' },
  { nome: 'Café Espresso', hex: '#362819', categoria: 'escuro' },
  { nome: 'Chocolate Amargo', hex: '#4A2E2B', categoria: 'escuro' },
  { nome: 'Chumbo Grafite', hex: '#424242', categoria: 'escuro' },
  { nome: 'Azul Meia-Noite', hex: '#192841', categoria: 'escuro' },

  // AZUIS & VERDES
  { nome: 'Azul Pavão', hex: '#1A5276', categoria: 'azul' },
  { nome: 'Azul Royal', hex: '#204080', categoria: 'azul' },
  { nome: 'Verde Esmeralda', hex: '#0E6655', categoria: 'verde' },
  { nome: 'Verde Oliva', hex: '#556B2F', categoria: 'verde' },
  { nome: 'Verde Musgo', hex: '#3B4D28', categoria: 'verde' },

  // METÁLICOS & GLITTERS
  { nome: 'Ouro Rosé Glow', hex: '#E6A8A4', categoria: 'metalico' },
  { nome: 'Champagne Shimmer', hex: '#EAD6B8', categoria: 'metalico' },
  { nome: 'Prata Cromado', hex: '#D0D4DC', categoria: 'metalico' },
  { nome: 'Bronze Radiante', hex: '#CD7F32', categoria: 'metalico' },
  { nome: 'Pérola Glaze', hex: '#F5F2EB', categoria: 'metalico' },
]

async function seedCores() {
  console.log(`🎨 Cadastrando ${CORES_CATALOGO.length} cores no catálogo...`)
  let criadas = 0
  let atualizadas = 0

  for (const c of CORES_CATALOGO) {
    const existe = await db.corEsmalte.findFirst({
      where: { nome: c.nome },
    })

    if (existe) {
      await db.corEsmalte.update({
        where: { id: existe.id },
        data: { hex: c.hex, categoria: c.categoria, ativo: true },
      })
      atualizadas++
    } else {
      await db.corEsmalte.create({
        data: { nome: c.nome, hex: c.hex, categoria: c.categoria, ativo: true },
      })
      criadas++
    }
  }

  console.log(`✅ Catálogo atualizado com sucesso!`)
  console.log(`   ${criadas} cores criadas, ${atualizadas} cores atualizadas.`)
}

seedCores()
  .catch((e) => {
    console.error('Erro no seed de cores:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
