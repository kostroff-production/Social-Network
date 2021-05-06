FROM python:3.8.3-alpine

ENV TZ Europe/Moscow
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apk update \
    && apk add postgresql-dev gcc python3-dev musl-dev

RUN pip install --upgrade pip
COPY ./requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN mkdir -p /usr/src/app/
RUN mkdir -p /usr/src/app/static/
RUN mkdir -p /usr/src/app/media/
WORKDIR /usr/src/app

COPY ./entrypoint.sh .

COPY . /usr/src/app

ENTRYPOINT ["/usr/src/app/entrypoint.sh"]
