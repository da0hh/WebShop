#   Берем официальный легкий образ Python
FROM python:3.11-slim

#   Задаем рабочую папку внутри контейнера
WORKDIR /app

#   Настраиваем Python: выключаем кэш файлов (.pyc) и включаем живой вывод логов
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

#  Копируем список зависимостей и устанавливаем их
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

#  Копируем весь код проекта в контейнер
COPY . .

#  Открываем порт для FastAPI
EXPOSE 8300

#  Запускаем сервер uvicorn (файл router.py, объект app)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8300"]