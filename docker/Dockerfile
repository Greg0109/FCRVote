FROM python:3.13.3-bullseye
WORKDIR /home
RUN mkdir -p /home/front
ENV ENV="production"
COPY ../src/front/build /home/front
COPY ../dist /home
RUN pip install /home/*.whl
LABEL authors="greg"
EXPOSE 1095
ENTRYPOINT ["fcrvote"]