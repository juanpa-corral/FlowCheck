// ============================================================
// FlowCheck 2.0 — Catálogo de Microlecciones
// Módulo 5: Educación Contextual
// ============================================================

import type { Profile } from '../types/database'
import type { BudgetSemaphore } from '../types/database'

export interface LessonSection {
  heading?: string
  body: string
}

export interface Lesson {
  id: string
  title: string
  emoji: string
  tag: string
  tagColor: string           // hex color
  summary: string            // 1-2 oraciones para la tarjeta
  sections: LessonSection[]  // contenido completo
  tip: string                // consejo accionable
  readTime: number           // minutos estimados
  /** Retorna true si esta lección es relevante para el perfil actual */
  trigger: (profile: Profile, semaphore: BudgetSemaphore) => boolean
  priority: 1 | 2 | 3       // 1=alta, 2=media, 3=general
}

// ── Catálogo ─────────────────────────────────────────────────

export const LESSONS_CATALOG: Lesson[] = [

  // ── PRIORIDAD ALTA (condiciones críticas) ─────────────────

  {
    id: 'tasa-efectiva-anual',
    title: '¿Qué es la TEA y cuánto te cuesta tu deuda?',
    emoji: '📊',
    tag: 'Deuda',
    tagColor: '#EF4444',
    summary: 'La Tasa Efectiva Anual revela el costo real de un crédito. ¿Sabes cuánto pagas de más?',
    readTime: 4,
    priority: 1,
    trigger: (p) => p.monthly_debt_payment > 0 || p.total_debt > 0,
    tip: 'Pide a tu banco o financiera la TEA de cada crédito antes de comparar. El banco que tiene la tasa nominal más baja no siempre es el más barato.',
    sections: [
      {
        heading: '¿Qué es la TEA?',
        body: 'La Tasa Efectiva Anual (TEA) es el costo real de un crédito durante un año, incluyendo la capitalización de los intereses. Es diferente a la Tasa Nominal Anual (TNA), que solo muestra el porcentaje sin considerar con qué frecuencia se cobran los intereses.',
      },
      {
        heading: 'TNA vs TEA: el ejemplo que importa',
        body: 'Un crédito con tasa del 2% mensual parece "barato". Pero si calculamos la TEA: (1 + 0.02)^12 - 1 = 26.8% al año. Es decir, por cada $1.000.000 prestado pagas $268.000 solo en intereses en un año. La TNA sería 24% (2% × 12), pero la TEA real es 26.8%.',
      },
      {
        heading: 'Por qué te importa como estudiante',
        body: 'Las financieras informales o el crédito del celular pueden tener tasas del 3-5% mensual, que se traduce en TEAs del 43% al 80% anual. El "gota a gota" ilegal puede superar el 400% EA. Siempre compara usando la TEA y desconfía de quienes solo te hablan de cuotas mensuales.',
      },
      {
        heading: 'Cómo pagar menos intereses',
        body: 'Dos estrategias probadas: (1) Método Avalancha — paga el mínimo en todas las deudas y destina el exceso a la de mayor TEA. Reduces el costo total más rápido. (2) Método Bola de Nieve — liquida primero la deuda más pequeña para ganar momentum psicológico.',
      },
    ],
  },

  {
    id: 'doom-spending',
    title: 'Doom Spending: cuando gastas porque estás estresado',
    emoji: '🛍️',
    tag: 'Conducta',
    tagColor: '#F59E0B',
    summary: 'Más del 25% de tu ingreso va a ocio. El doom spending puede estar saboteando tus metas sin que te des cuenta.',
    readTime: 3,
    priority: 1,
    trigger: (p) => p.monthly_income > 0 && (p.leisure_expenses / p.monthly_income) > 0.25,
    tip: 'Aplica la regla del "timer de 24 horas": cuando sientas el impulso de comprar algo no esencial, anótalo y espera un día. Si al día siguiente aún lo quieres y cabe en tu presupuesto, cómpralo sin culpa.',
    sections: [
      {
        heading: '¿Qué es el Doom Spending?',
        body: 'El "doom spending" (gastar por desesperación) es el patrón de realizar compras impulsivas cuando nos sentimos ansiosos, estresados o sin esperanza sobre el futuro. No es debilidad de carácter; es una respuesta neurológica al estrés que activa el sistema de recompensa del cerebro.',
      },
      {
        heading: 'Los 3 gatillos más comunes en estudiantes',
        body: '(1) Estrés académico — parciales, entregas, notas malas. (2) FOMO (Fear Of Missing Out) — ver en redes que otros salen, viajan o compran. (3) Fatiga de decisiones — después de estudiar mucho, el cerebro busca gratificación fácil. El problema: el alivio dura minutos; el daño financiero dura semanas.',
      },
      {
        heading: 'La paradoja del control',
        body: 'Intentar suprimir el impulso de comprar con pura fuerza de voluntad raramente funciona. En cambio, funciona mejor: identificar el gatillo emocional → buscar un sustituto (caminar, llamar a un amigo, hacer 10 minutos de deporte) → volver a la decisión de compra con la mente fría.',
      },
      {
        heading: 'Tu presupuesto y el ocio',
        body: 'La regla 50/30/20 sugiere máximo el 30% del ingreso para deseos (incluyendo ocio). Cuando superas el 25-30% en ocio específicamente, suele ser señal de gasto emocional. No se trata de eliminar el ocio — se trata de hacerlo intencional, no reactivo.',
      },
    ],
  },

  {
    id: 'deuda-inteligente',
    title: 'Deuda Inteligente vs Deuda Tóxica',
    emoji: '⚖️',
    tag: 'Deuda',
    tagColor: '#EF4444',
    summary: 'No toda deuda es mala. Aprende a distinguir las que te construyen de las que te destruyen.',
    readTime: 4,
    priority: 1,
    trigger: (p, s) =>
      s.status === 'rojo' ||
      (p.monthly_income > 0 && p.monthly_debt_payment / p.monthly_income > 0.30),
    tip: 'Lista todas tus deudas con su TEA y el saldo pendiente. Las que tienen TEA > 20% EA y financian consumo son candidatas a liquidar primero. Antes de tomar una nueva deuda, pregúntate: ¿este dinero me va a generar más de lo que me cuesta?',
    sections: [
      {
        heading: 'Deuda Inteligente',
        body: 'Financia activos que se valorizan o generan ingresos futuros: crédito educativo (tu carrera te dará retorno), crédito productivo (herramientas para trabajar freelance), hipotecario en condiciones favorables. La clave: el retorno esperado supera el costo de la deuda.',
      },
      {
        heading: 'Deuda Tóxica',
        body: 'Financia consumo con tasas altas: tarjetas de crédito en cuotas de consumo, créditos de libre inversión para vacaciones, créditos del celular, "gota a gota". Estas deudas tienen TEAs del 30% al 400%+ y financian cosas que se deprecian instantáneamente.',
      },
      {
        heading: 'La señal de alerta del 30%',
        body: 'Si tu pago mensual de deudas supera el 30% de tu ingreso, estás en zona de estrés financiero. Esto limita tu capacidad de ahorro, te hace vulnerable a imprevistos y genera un ciclo difícil de romper. Con más del 40%, es una situación crítica que requiere acción inmediata.',
      },
      {
        heading: 'El efecto bola de nieve de la deuda tóxica',
        body: 'Una deuda de $2.000.000 al 3% mensual (TEA ~43%): si solo pagas el mínimo, en 2 años habrás pagado $2.400.000 y aún deberás más de $1.000.000. El interés compuesto funciona en tu contra cuando debes dinero y a tu favor cuando lo prestas (ahorras).',
      },
    ],
  },

  // ── PRIORIDAD MEDIA ───────────────────────────────────────

  {
    id: 'fondo-emergencia',
    title: 'El Fondo de Emergencia: tu red de seguridad',
    emoji: '🛡️',
    tag: 'Ahorro',
    tagColor: '#10B981',
    summary: 'Un fondo de emergencia previene que un imprevisto se convierta en una deuda de meses.',
    readTime: 3,
    priority: 2,
    trigger: (p) =>
      p.emergency_fund < (p.fixed_expenses + p.variable_expenses),
    tip: 'Abre una cuenta de ahorros separada — idealmente una cuenta digital como Nequi o Daviplata — y nómbrala "Emergencias". Automatiza una transferencia del 10% de tu ingreso el mismo día que te paguen. No la toques para gastos planeados.',
    sections: [
      {
        heading: '¿Para qué sirve realmente?',
        body: 'El fondo de emergencia NO es para vacaciones, ropa en oferta ni "oportunidades" de inversión. Es para: pérdida de empleo o beca, emergencia médica, reparación urgente del equipo de trabajo, o cualquier gasto imprevisto que, sin el fondo, te obligaría a endeudarte.',
      },
      {
        heading: '¿Cuánto necesitas?',
        body: 'La regla general: entre 3 y 6 meses de tus gastos fijos (arriendo, transporte, alimentación básica). Como estudiante, con 1-2 meses ya tienes un colchón valioso. No tiene que ser perfecto para empezar — $500.000 es mejor que $0.',
      },
      {
        heading: '¿Dónde guardarlo?',
        body: 'Criterios: (1) Liquidez — puedes retirarlo en 24-48 horas. (2) Seguridad — no está expuesto a volatilidad del mercado. (3) Algo de rendimiento — mejor en cuenta de ahorros o CDT a 30 días que bajo el colchón. No lo pongas en inversiones de riesgo.',
      },
      {
        heading: 'Cómo construirlo si el ingreso es justo',
        body: 'Incluso con ingresos ajustados es posible: (1) Reserva el 5-10% del ingreso apenas lo recibas. (2) Destina cualquier ingreso extra (bonos, ventas, trabajos freelance) al fondo hasta completarlo. (3) Reduce temporalmente el ocio un 5% y muévelo al fondo. En 6-12 meses tendrás tu primer mes de colchón.',
      },
    ],
  },

  {
    id: 'interes-compuesto',
    title: 'El Interés Compuesto: la magia del tiempo',
    emoji: '🚀',
    tag: 'Inversión',
    tagColor: '#1D9E75',
    summary: '"El interés compuesto es la octava maravilla del mundo" — A. Einstein. Descubre por qué empezar hoy vale más que empezar mañana.',
    readTime: 4,
    priority: 2,
    trigger: (p) => p.savings_goal > 0 || p.monthly_income > 0,
    tip: 'Usa el simulador de interés compuesto en esta pantalla. Ingresa lo que puedes ahorrar mensualmente y compara escenarios. Verás que la diferencia entre empezar hoy vs en 5 años puede ser de millones de pesos.',
    sections: [
      {
        heading: '¿Qué es el interés compuesto?',
        body: 'Es el interés que ganas sobre tu capital inicial Y sobre los intereses que ya ganaste. Es decir, tus ganancias también generan ganancias. Contrasta con el interés simple, donde solo tu capital inicial gana intereses.',
      },
      {
        heading: 'El poder del tiempo: el ejemplo que lo cambia todo',
        body: 'Ana empieza a ahorrar $200.000/mes desde los 20 años al 8% EA y para a los 30 (solo 10 años de aportes). Carlos empieza a los 30 y ahorra hasta los 60 (30 años). Resultado a los 60: Ana tiene ~$350M, Carlos solo ~$270M. Ana aportó MENOS dinero pero empezó antes. El tiempo multiplicó su dinero.',
      },
      {
        heading: 'La fórmula (sencilla)',
        body: 'Valor Futuro = Capital Inicial × (1 + tasa)^años. Ejemplo: $1.000.000 al 10% EA durante 20 años = $1.000.000 × (1.10)^20 = $6.727.500. Tu millón se convirtió en casi 7 millones sin hacer nada más que esperar.',
      },
      {
        heading: 'Dónde aprovechar el interés compuesto en Colombia',
        body: 'CDTs a largo plazo (reinvirtiendo al vencimiento), fondos de inversión colectiva, acciones y ETFs a largo plazo, y aportes voluntarios a pensión (FPV). La clave: no retirar los rendimientos; dejarlos crecer dentro del instrumento.',
      },
    ],
  },

  // ── PRIORIDAD GENERAL (siempre disponibles) ───────────────

  {
    id: 'regla-50-30-20',
    title: 'La Regla 50/30/20: divide tu ingreso sin estrés',
    emoji: '🥧',
    tag: 'Presupuesto',
    tagColor: '#1D9E75',
    summary: 'Una fórmula simple y comprobada para repartir tu ingreso entre lo que necesitas, lo que disfrutas y lo que ahorras.',
    readTime: 3,
    priority: 3,
    trigger: () => true,
    tip: 'Calcula tu distribución actual: divide cada categoría de gasto entre tu ingreso mensual y multiplica por 100. Compara con el 50/30/20. No busques ser perfecto desde el primer mes; ajusta gradualmente.',
    sections: [
      {
        heading: '50% → Necesidades',
        body: 'Lo que no puedes evitar: arriendo o pensión, transporte para estudiar y trabajar, alimentación básica, servicios públicos, salud. Si superas el 50% en necesidades, es señal de que el ingreso es insuficiente para tu nivel de gastos fijos — considera opciones para reducir costos fijos o aumentar ingresos.',
      },
      {
        heading: '30% → Deseos',
        body: 'Lo que disfrutas pero no es estrictamente necesario: salidas, ropa, suscripciones, ocio, viajes. La clave es que sea intencional, no impulsivo. Dentro de este 30% puedes hacer lo que quieras sin culpa — eso es finanzas saludables.',
      },
      {
        heading: '20% → Ahorro e inversión',
        body: 'Pago anticipado de deudas, fondo de emergencia, inversiones para el futuro, aportes voluntarios a pensión. Este 20% es negociable con tu realidad: con $800.000/mes, el 10% (80.000) ya es un gran comienzo.',
      },
      {
        heading: 'Adaptación para estudiantes',
        body: 'Si tu ingreso es bajo o variable, una variante es 60/20/20 (más para necesidades) o incluso 70/15/15. Lo importante no es el porcentaje exacto sino el hábito de separar siempre algo para el futuro antes de gastar el resto.',
      },
    ],
  },

  {
    id: 'pagate-primero',
    title: 'Págate a ti mismo primero',
    emoji: '💰',
    tag: 'Ahorro',
    tagColor: '#10B981',
    summary: 'La trampa del "ahorro con el sobrante" nunca funciona. El secreto es invertir el orden: primero ahorras, luego gastas.',
    readTime: 3,
    priority: 3,
    trigger: () => true,
    tip: 'Configura hoy mismo una transferencia automática al día que recibes tu ingreso hacia una cuenta de ahorros o inversión. Aunque sea $50.000. La automatización vence a la fuerza de voluntad siempre.',
    sections: [
      {
        heading: 'La trampa del sobrante',
        body: 'La mayoría de las personas piensa: "gasto lo que necesito y ahorro lo que sobre". El problema: nunca sobra nada. Los gastos se expanden para llenar el ingreso disponible — los economistas llaman a esto la Ley de Parkinson del dinero.',
      },
      {
        heading: 'El principio correcto',
        body: 'Invierte el orden: apenas recibes tu ingreso, transfiere tu porcentaje de ahorro a una cuenta separada ANTES de pagar cualquier otra cosa. Luego vive con lo que queda. Tu cerebro se adapta al ingreso disponible y encontrará formas de cubrir los gastos.',
      },
      {
        heading: 'La automatización como superpoder',
        body: 'Configurar una transferencia automática elimina la necesidad de tomar la decisión de ahorrar cada mes. Las decisiones difieren de mes a mes según el estado de ánimo; la automatización no. En Nequi, Daviplata y la mayoría de bancos puedes configurar "bolsillos" o transferencias programadas.',
      },
      {
        heading: '¿Cuánto ahorrar?',
        body: 'No hay una respuesta única. Si nunca has ahorrado, empieza con el 5% y auméntalo un 1% cada 2 meses. Si tienes deudas de alto costo (TEA >20%), prioriza liquidarlas antes de invertir. El mejor porcentaje de ahorro es el que puedes mantener consistentemente.',
      },
    ],
  },

  // ── LECCIONES FASE 5 ─────────────────────────────────────────

  {
    id: 'tarjeta-sin-intereses',
    title: 'Cómo usar una tarjeta de crédito sin pagar intereses',
    emoji: '💳',
    tag: 'Crédito',
    tagColor: '#E24B4A',
    summary: '¿Sabías que una tarjeta de crédito puede ser completamente gratis si sabes cómo usarla? Todo está en la fecha de corte.',
    readTime: 4,
    priority: 2,
    trigger: () => true,
    tip: 'Paga el 100% del saldo antes de la fecha de pago — no el mínimo, el TOTAL. Configura un débito automático por el total del extracto para no olvidarlo nunca.',
    sections: [
      {
        heading: 'La fecha de corte y la fecha de pago',
        body: 'Tu tarjeta tiene dos fechas clave: (1) Fecha de corte — cuando el banco "cierra" el período y calcula lo que debes. (2) Fecha de pago — cuando debes pagar. Tienes entre 20-25 días después del corte para pagar sin intereses. Ese período es GRATIS.',
      },
      {
        heading: 'La trampa del pago mínimo',
        body: 'El banco te muestra el "pago mínimo" (5-10% del saldo) para tentarte a pagar solo eso. Si lo haces, el saldo restante genera intereses desde el día de la compra — con TEAs entre 25% y 55% EA en Colombia. Una deuda de $500.000 en "pago mínimo" puede convertirse en $1.200.000 en un año.',
      },
      {
        heading: 'La estrategia correcta',
        body: 'Trata tu tarjeta como una tarjeta débito pero con 30 días de gracia: solo gasta lo que ya tienes en tu cuenta de ahorros. Cuando llegue el extracto, transfieres ese monto y listo. Ganas: puntos de lealtad, historial crediticio positivo, y pagas $0 de intereses.',
      },
      {
        heading: 'Cuándo la tarjeta sí te cobra',
        body: 'Te cobran intereses si: (1) Pagas menos del total. (2) Avanzas dinero en efectivo (tasa aún más alta). (3) Compras en cuotas — siempre verifica la tasa antes de cuotear. (4) Superas el límite. El único uso que no te cobra es pagar el total a tiempo.',
      },
    ],
  },

  {
    id: 'identificar-tasas-abusivas',
    title: 'Cómo identificar un crédito con tasas abusivas',
    emoji: '🔎',
    tag: 'Deuda',
    tagColor: '#E24B4A',
    summary: 'No todos los créditos son iguales. Aprende a detectar las "banderas rojas" que indican tasas predatorias antes de firmar.',
    readTime: 3,
    priority: 2,
    trigger: (p) => p.monthly_debt_payment > 0 || p.total_debt > 0,
    tip: 'Antes de firmar, pide la TEA por escrito. Si no te la quieren dar o te hablan solo de cuotas, es señal de alerta. Compara en al menos 3 entidades antes de decidir.',
    sections: [
      {
        heading: 'Las 5 banderas rojas de un crédito predatorio',
        body: '(1) Solo te hablan de la cuota mensual, no de la TEA. (2) Aprueban sin verificar tu capacidad de pago. (3) TEA muy por encima de la tasa de usura (la máxima legal en Colombia es publicada mensualmente por la Superfinanciera). (4) Cobros "administrativos" ocultos que inflan el costo real. (5) Presión para firmar rápido "porque la oferta vence hoy".',
      },
      {
        heading: 'La tasa de usura en Colombia',
        body: 'La Superintendencia Financiera de Colombia publica mensualmente la "Tasa de Usura" — el máximo legal que puede cobrar una entidad formal. Para créditos de consumo ordinario, históricamente ronda el 28-35% EA. Cualquier tasa formal que supere ese límite es ilegal. El "gota a gota" informal puede superar el 300-400% EA.',
      },
      {
        heading: 'Cómo comparar créditos correctamente',
        body: 'Siempre compara usando: (1) TEA (tasa efectiva anual) — el verdadero costo anual. (2) Costo Total del Crédito (CTC) — suma total a pagar incluyendo seguros, administración y capital. (3) Plazo — a más tiempo, menos cuota pero más intereses pagados en total.',
      },
      {
        heading: 'Alternativas a créditos costosos',
        body: 'Si necesitas liquidez urgente: (1) Fondo de empleados de tu empresa — tasas muy competitivas. (2) Cooperativas financieras — reguladas y con tasas razonables. (3) Crédito de libre inversión en banco donde ya tienes cuenta — suele ser más barato. (4) Negociar un anticipo de salario o beca con tu empleador/universidad.',
      },
    ],
  },

  {
    id: 'primer-apartamento',
    title: 'El camino a tu primer apartamento',
    emoji: '🏠',
    tag: 'Metas',
    tagColor: '#1D9E75',
    summary: 'Comprar vivienda parece inalcanzable, pero con un plan de 5-7 años y los hábitos correctos desde hoy, es completamente posible.',
    readTime: 5,
    priority: 3,
    trigger: () => true,
    tip: 'Abre hoy una cuenta de ahorro programado exclusiva para tu cuota inicial. Bautízala "Mi apartamento" y automatiza un aporte mensual aunque sea pequeño. La constancia por 5 años hace milagros.',
    sections: [
      {
        heading: '¿Cuánto necesitas para empezar?',
        body: 'Para un crédito hipotecario en Colombia necesitas: (1) Cuota inicial del 30% del valor del inmueble (el banco financia el 70%). Para un apartamento de $250M, necesitas $75M de entrada. (2) Gastos notariales y de registro (≈3-4% del valor). (3) Reservas para el banco (demuestras capacidad de pago). Total realista: entre el 33-35% del valor del inmueble.',
      },
      {
        heading: 'El historial crediticio: tu activo más importante',
        body: 'Los bancos revisan tu historial en DataCrédito antes de aprobar. Para una hipoteca necesitas: (1) Ninguna deuda en mora durante los últimos 5 años. (2) Score crediticio alto (idealmente > 750). (3) Al menos 1-2 años de historial crediticio. Empieza a construirlo HOY con una tarjeta de crédito de bajo límite pagada al 100% cada mes.',
      },
      {
        heading: 'La estrategia del ahorro de la cuota inicial',
        body: 'Si quieres un apartamento de $250M en 7 años, necesitas acumular ~$82M (cuota + gastos). Eso es $975.000 al mes si solo ahorras en CDT al 10% EA. Pero si lo inviertes en un portafolio mixto (CDT + fondos), podrías necesitar solo $800.000/mes. El punto clave: empezar cuanto antes duplica la viabilidad.',
      },
      {
        heading: 'El subsidio de vivienda: ¿aplicas?',
        body: 'En Colombia existen subsidios del Gobierno (Mi Casa Ya, Semillero de Propietarios) para vivienda VIS (hasta ~$135M) para personas sin vivienda propia y con ingresos hasta 4 SMMLV. Si aplicas, el Estado puede subsidiar parte de la cuota inicial. Consulta en el Ministerio de Vivienda — puede cambiar completamente el cálculo.',
      },
    ],
  },
]

// ── Función de selección contextual ──────────────────────────

/**
 * Retorna las lecciones más relevantes para el perfil dado,
 * ordenadas por prioridad (1 = más urgente).
 */
export function getContextualLessons(
  profile: Profile,
  semaphore: BudgetSemaphore,
  limit = 3,
): Lesson[] {
  return LESSONS_CATALOG
    .filter((l) => l.trigger(profile, semaphore))
    .sort((a, b) => a.priority - b.priority)
    .slice(0, limit)
}
