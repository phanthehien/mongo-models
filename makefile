IMAGE_NAME = jenius2/mongo-models

unit-test:
	echo "Running make test";
	# Clean up any containers which are running from old integration tests.
	docker ps -a | grep mongo-models | awk '{ print $$1 }' | xargs docker rm -f || true
	echo "Clean docker";

    # Make sure latest images are downloaded for repository for all dependencies
	images=$$(grep 'image' docker-compose.test.yml | awk '{print $$2}' | sort | uniq); \
	for image in $${images}; do docker pull $${image}; done

	# Bring up the stack (in the background), wait for the service to listen
	# on 3000, run the tests, bring down the stack, exit with test results.
	(command docker-compose -f docker-compose.test.yml -p mongo-models up --force-recreate --build &); \
	sleep 30; \
	npm run test; \
	RESULT="$$?" && echo "Test Result is: $$RESULT"; \
	docker-compose -f docker-compose.test.yml down; \
	exit $$RESULT;