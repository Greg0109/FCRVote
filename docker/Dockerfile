FROM python:3.13.3-bullseye
WORKDIR /home
RUN mkdir -p /home/front
ENV ENV="production"
COPY ../src/front/build /home/front
RUN pip install -e /home
LABEL authors="greg"
ENTRYPOINT ["fcrvote"]