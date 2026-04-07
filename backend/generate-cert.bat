@echo off
cd cert
openssl req -x509 -newkey rsa:4096 -keyout server.key -out server.crt -days 365 -nodes -subj "/C=CR/ST=SanJose/L=SanJose/O=UTN/CN=localhost"
echo Certificado generado exitosamente
pause
