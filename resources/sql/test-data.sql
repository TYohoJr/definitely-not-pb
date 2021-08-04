INSERT INTO secret_question(question) VALUES ('What is your dream job?');
INSERT INTO secret_question(question) VALUES ('What is your mothers maiden name?');
INSERT INTO secret_question(question) VALUES ('Who was your first pets name?');

INSERT INTO account_type(type) VALUES ('test');
INSERT INTO account_type(type) VALUES ('free');
INSERT INTO account_type(type) VALUES ('premium');

INSERT INTO file_type(type) VALUES ('image/apng');
INSERT INTO file_type(type) VALUES ('image/avif');
INSERT INTO file_type(type) VALUES ('image/gif');
INSERT INTO file_type(type) VALUES ('image/jpeg');
INSERT INTO file_type(type) VALUES ('image/png');
INSERT INTO file_type(type) VALUES ('image/svg+xml');
INSERT INTO file_type(type) VALUES ('image/webp');



INSERT INTO app_user(username,secret_question_id,secret_question_answer,password_hash) SELECT 'tyohojr',sq.id,'Bilinski','$2a$10$GSVqlh1ZNJ2PnOtWtYWYMOxrh4WnKq.m6pSbwNm6hWNjI3GXLsfr.' FROM secret_question sq WHERE sq.question='What is your mothers maiden name?';

INSERT INTO account_info(app_user_id, account_type_id, email, is_email_confirmed) SELECT au.id,aty.id,'tyohojr@gmail.com',TRUE FROM app_user au, account_type aty WHERE au.username='tyohojr' AND aty.type='test';

INSERT INTO album(name,app_user_id) SELECT 'testing album',au.id FROM app_user au WHERE au.username='tyohojr';

INSERT INTO photo(app_user_id,name,description,s3_bucket,s3_key,file_type_id) SELECT au.id,'bulbasaur.png','','definitely-not-photobucket','users/1/photos/bulbasaur.png',ft.id FROM file_type ft, app_user au WHERE ft.type='image/png' AND au.username='tyohojr';
INSERT INTO photo(app_user_id,name,description,s3_bucket,s3_key,file_type_id) SELECT au.id,'flaming_cat-wallpaper.jpg','','definitely-not-photobucket','users/1/photos/flaming_cat-wallpaper-3840x2160.jpg',ft.id FROM file_type ft, app_user au WHERE ft.type='image/jpeg' AND au.username='tyohojr';
INSERT INTO photo(app_user_id,name,description,s3_bucket,s3_key,file_type_id) SELECT au.id,'wide-wallpaper.jpg','','definitely-not-photobucket','users/1/photos/fXIoa0N.jpg',ft.id FROM file_type ft, app_user au WHERE ft.type='image/jpeg' AND au.username='tyohojr';

INSERT INTO album_photo(album_id,photo_id) SELECT al.id,p.id FROM album al, photo p WHERE al.name='testing album' AND p.name='bulbasaur.png';
INSERT INTO album_photo(album_id,photo_id) SELECT al.id,p.id FROM album al, photo p WHERE al.name='testing album' AND p.name='flaming_cat-wallpaper.jpg';
INSERT INTO album_photo(album_id,photo_id) SELECT al.id,p.id FROM album al, photo p WHERE al.name='testing album' AND p.name='wide-wallpaper.jpg';
