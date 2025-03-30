
FROM python:3.12.3


WORKDIR /app


COPY . /app


EXPOSE 8000

CMD ["sh", "-c", "python /app/manage.py migrate && python /app/manage.py runserver 0.0.0.0:8000"]
