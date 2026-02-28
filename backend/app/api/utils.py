from app.model.message import Message

COMMON_RESPONSES = {
    404: {"model": Message, "description": "Recurso no encontrado"},
    401: {"model": Message, "description": "No autorizado"}
}