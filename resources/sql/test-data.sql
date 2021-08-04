INSERT INTO secret_question(question) VALUES ('What is your dream job?');
INSERT INTO secret_question(question) VALUES ('What is your mothers maiden name?');
INSERT INTO secret_question(question) VALUES ('Who was your first pets name?');

INSERT INTO app_user(username,secret_question_id,secret_question_answer,password_hash) VALUES ('tyohojr',2,'Bilinski','$2a$10$GSVqlh1ZNJ2PnOtWtYWYMOxrh4WnKq.m6pSbwNm6hWNjI3GXLsfr.');

INSERT INTO album(name,app_user_id) VALUES ('testing album',1);

INSERT INTO file_type(type) VALUES ('image/apng');
INSERT INTO file_type(type) VALUES ('image/avif');
INSERT INTO file_type(type) VALUES ('image/gif');
INSERT INTO file_type(type) VALUES ('image/jpeg');
INSERT INTO file_type(type) VALUES ('image/png');
INSERT INTO file_type(type) VALUES ('image/svg+xml');
INSERT INTO file_type(type) VALUES ('image/webp');

INSERT INTO photo(app_user_id,name,description,s3_bucket,s3_key,file_type_id) SELECT 1,'bulbasaur.png','','definitely-not-photobucket','users/1/photos/bulbasaur.png',ft.id FROM file_type ft WHERE type='image/png';
INSERT INTO photo(app_user_id,name,description,s3_bucket,s3_key,file_type_id) SELECT 1,'flaming_cat-wallpaper-3840x2160.jpg','','definitely-not-photobucket','users/1/photos/flaming_cat-wallpaper-3840x2160.jpg',ft.id FROM file_type ft WHERE type='image/jpeg';
INSERT INTO photo(app_user_id,name,description,s3_bucket,s3_key,file_type_id) SELECT 1,'fXIoa0N.jpg','','definitely-not-photobucket','users/1/photos/fXIoa0N.jpg',ft.id FROM file_type ft WHERE type='image/jpeg';

INSERT INTO album_photo(album_id,photo_id) VALUES (1,1);
INSERT INTO album_photo(album_id,photo_id) VALUES (1,2);
INSERT INTO album_photo(album_id,photo_id) VALUES (1,3);
