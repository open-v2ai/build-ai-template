docker build -t chagent-web:0.1 .

docker rm -f chagent-web

docker run -d -p 3000:3000 --name chagent-web chagent-web:0.1

echo "Deployed to http://localhost:3000"