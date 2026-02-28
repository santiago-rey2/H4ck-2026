from ..crud.base import CRUDBase
from ..model.category import Category, CategoryBase


class CRUDCategory(CRUDBase[Category, CategoryBase]):
 pass

category_service = CRUDCategory(Category)