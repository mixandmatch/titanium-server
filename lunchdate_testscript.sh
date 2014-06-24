curl  -H "Content-Type: application/json" -d '{"username": "mario.kart@thomas-reinberger.de", "password": "1qayxsw2"}' http://localhost:8080/user/login -b cookies_mariokart.txt -c cookies_mariokart.txt
curl  -H "Content-Type: application/json" -d '{"name": "Essen", "start_time": "2014-06-27T12:00:00+0200", "place_id": "53429dcd1316e90b6e26e251"}' http://localhost:8080/event -b cookies_mariokart.txt -c cookies_mariokart.txt

curl  -H "Content-Type: application/json" -d '{"username": "mario.gomez@thomas-reinberger.de", "password": "1qayxsw2"}' http://localhost:8080/user/login -b cookies_mariogomez.txt -c cookies_mariogomez.txt
curl  -H "Content-Type: application/json" -d '{"name": "Essen", "start_time": "2014-06-27T12:00:00+0200", "place_id": "53429dcd1316e90b6e26e251"}' http://localhost:8080/event -b cookies_mariogomez.txt -c cookies_mariogomez.txt

curl  -H "Content-Type: application/json" -d '{"username": "mario.barth@thomas-reinberger.de", "password": "1qayxsw2"}' http://localhost:8080/user/login -b cookies_mariobarth.txt -c cookies_mariobarth.txt
curl  -H "Content-Type: application/json" -d '{"name": "Essen", "start_time": "2014-06-27T12:00:00+0200", "place_id": "53429dcd1316e90b6e26e251"}' http://localhost:8080/event -b cookies_mariobarth.txt -c cookies_mariobarth.txt

curl  -H "Content-Type: application/json" -d '{"username": "info@thomas-reinberger.de", "password": "1qayxsw2"}' http://localhost:8080/user/login -b cookies_thomasreinberger.txt -c cookies_thomasreinberger.txt
curl  -H "Content-Type: application/json" -d '{"name": "Essen", "start_time": "2014-06-27T12:00:00+0200", "place_id": "53429dcd1316e90b6e26e251"}' http://localhost:8080/event -b cookies_thomasreinberger.txt -c cookies_thomasreinberger.txt