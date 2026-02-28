from enum import Enum, auto

class ItemFormat(str, Enum):
    def _generate_next_value_(name, start, count, last_values):
        return name

    LINK = auto()
    SHORT_TEXT = auto()
    LONG_TEXT = auto()