from datetime import date, timedelta
from dateutil.relativedelta import relativedelta
import random


def next_refresh_date(
        last_date : date | None = None,
        date_to_refresh: int = 14
) -> date:
    if  last_date is None:
        last_date = date.today()

    return last_date + timedelta(days = date_to_refresh)


def check_refresh_due(
        refresh_date : date,
        today: date | None = None
) -> bool:
    if today is None: 
        today = date.today()

    return refresh_date <= today



def initialize_refresh_date(
        start_date: date | None = None,
        date_to_refresh: int = 14
) -> date:
    
    if  start_date is None:
        start_date = date.today()

    time_to_refresh = random.randint(1, date_to_refresh)
    return start_date + timedelta(days = time_to_refresh)