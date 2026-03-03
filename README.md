This is a Django Rest Framework that use for API creation

Window initialise steps:
1. Create a Virtual Environment:

python -m venv venv

2. Activate Virtual Environment:

.\venv\Scripts\activate

3. Install Dependencies:

pip install -r requirements.txt

4. Run the Development Server:

python manage.py migrate

python manage.py runserver

5. Check in your browser:

http://127.0.0.1:8000/api/hello/

Don't touch "seng3011" it's the global settings!

core/views.py: Write your API logic and functions here.

core/urls.py: Define the paths for your APIs here.


