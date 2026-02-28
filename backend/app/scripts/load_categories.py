from sqlmodel import Session, create_engine, select
from app.model.category import Category
from app.core.config import settings
from app.model.items import Item

engine = create_engine(str(settings.DATABASE_URL))

CATEGORIES_DATA = [
    {"name": "Tecnología", "description": "Software, hardware, gadgets e innovaciones."},
    {"name": "Ocio", "description": "Entretenimiento general y pasatiempos."},
    {"name": "Deportes", "description": "Actividades físicas, equipos y eventos atléticos."},
    {"name": "Cocina", "description": "Recetas, gastronomía y técnicas culinarias."},
    {"name": "Streaming", "description": "Plataformas de video en vivo y contenido bajo demanda."},
    {"name": "Finanzas", "description": "Economía, inversiones, ahorro y criptomonedas."},
    {"name": "Educación", "description": "Cursos, aprendizaje académico y tutoriales."},
    {"name": "Salud", "description": "Bienestar físico, medicina y nutrición."},
    {"name": "Ciencia", "description": "Astronomía, biología, física y descubrimientos."},
    {"name": "Cine", "description": "Críticas, estrenos y noticias del séptimo arte."},
    {"name": "Música", "description": "Géneros, artistas, instrumentos y conciertos."},
    {"name": "Viajes", "description": "Destinos, guías turísticas y consejos de vuelo."},
    {"name": "Videojuegos", "description": "Consolas, PC gaming y noticias de la industria."},
    {"name": "Moda", "description": "Tendencias de ropa, accesorios y estilo personal."},
    {"name": "Política", "description": "Noticias gubernamentales, leyes y análisis social."},
    {"name": "Negocios", "description": "Emprendimiento, marketing y gestión empresarial."},
    {"name": "Arte", "description": "Pintura, escultura, diseño y exposiciones."},
    {"name": "Literatura", "description": "Libros, autores, poesía y clubes de lectura."},
    {"name": "Historia", "description": "Eventos pasados, arqueología y biografía."},
    {"name": "Mascotas", "description": "Cuidado de animales, veterinaria y razas."},
    {"name": "Naturaleza", "description": "Medio ambiente, ecología y flora/fauna."},
    {"name": "Automotriz", "description": "Coches, motos y movilidad sostenible."},
    {"name": "Arquitectura", "description": "Diseño de edificios, urbanismo e interiorismo."},
    {"name": "Psicología", "description": "Salud mental, comportamiento y autoayuda."},
    {"name": "Religión", "description": "Espiritualidad, creencias y teología."},
    {"name": "Fotografía", "description": "Técnicas, cámaras, edición y galerías."},
    {"name": "Bricolaje", "description": "Proyectos manuales (DIY) y reparaciones del hogar."},
    {"name": "Jardinería", "description": "Cuidado de plantas, huertos y paisajismo."},
    {"name": "Humor", "description": "Memes, chistes y contenido satírico."},
    {"name": "Crimen Real", "description": "Casos sin resolver, documentales y misterio."},
    {"name": "Efemérides", "description": "Datos curiosos del día y aniversarios."},
    {"name": "Astronomía", "description": "Espacio profundo, planetas y exploración espacial."},
    {"name": "Programación", "description": "Desarrollo de software, código y algoritmos."},
    {"name": "Ciberseguridad", "description": "Protección de datos, hacking ético y privacidad."},
    {"name": "Derecho", "description": "Asesoría legal, juicios y normativa."},
    {"name": "Relaciones", "description": "Pareja, familia, amistad y consejos sociales."},
    {"name": "Belleza", "description": "Maquillaje, cuidado de la piel y estética."},
    {"name": "Inmobiliaria", "description": "Compra, venta y alquiler de propiedades."},
    {"name": "Filosofía", "description": "Corrientes de pensamiento y ética."},
    {"name": "Cultura Pop", "description": "Celebridades, tendencias virales y redes sociales."},
    {"name": "Idiomas", "description": "Aprendizaje de lenguas y traducción."},
    {"name": "Anime", "description": "Animación japonesa, manga y cultura otaku."},
    {"name": "Infantil", "description": "Contenido para niños, juguetes y crianza."},
    {"name": "Espectáculos", "description": "Teatro, musicales y eventos en vivo."},
    {"name": "Sostenibilidad", "description": "Energías renovables y consumo responsable."},
    {"name": "Misterio", "description": "Fenómenos paranormales y teorías de conspiración."},
    {"name": "Logística", "description": "Transporte de mercancías y cadena de suministro."},
    {"name": "Recursos Humanos", "description": "Empleo, reclutamiento y vida laboral."},
    {"name": "Eventos", "description": "Organización de bodas, fiestas y conferencias."},
    {"name": "Otros", "description": "Contenido misceláneo que no encaja en lo anterior."}
]


def seed_categories():
    with Session(engine) as session:
        print(f"--- Iniciando carga de {len(CATEGORIES_DATA)} categorías ---")
        for cat_dict in CATEGORIES_DATA:
            # Buscamos por nombre para evitar duplicados
            statement = select(Category).where(Category.name == cat_dict["name"])
            existing_cat = session.exec(statement).first()

            if not existing_cat:
                category = Category(**cat_dict)
                session.add(category)
                print(f"✅ Agregada: {cat_dict['name']}")
            else:
                print(f"➖ Omitida (ya existe): {cat_dict['name']}")

        session.commit()
        print("--- Proceso completado con éxito ---")


if __name__ == "__main__":
    seed_categories()