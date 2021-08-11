CREATE TABLE IF NOT EXISTS secret_question(
    id       INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    question TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS app_user(
    id                     INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    username               VARCHAR(50) NOT NULL UNIQUE,
    secret_question_id     INT NOT NULL,
    secret_question_answer VARCHAR(50) NOT NULL,
    password_hash          TEXT,
    is_password_expired    BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_secret_question FOREIGN KEY(secret_question_id) REFERENCES secret_question(id)
);
CREATE TABLE IF NOT EXISTS album(
    id          INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    name        VARCHAR(50) NOT NULL,
    app_user_id INT NOT NULL,
    CONSTRAINT fk_app_user FOREIGN KEY(app_user_id) REFERENCES app_user(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS file_type(
    id   INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    type TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS photo(
    id                 INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    app_user_id        INT NOT NULL,
    name               VARCHAR(50) NOT NULL,
    description        VARCHAR(200) NOT NULL,
    s3_bucket          TEXT NOT NULL,
    s3_key             TEXT NOT NULL, 
    file_type_id       INTEGER NOT NULL,
    size               BIGINT NOT NULL,
    uploaded_timestamp TIMESTAMP NOT NULL,
    CONSTRAINT fk_app_user FOREIGN KEY(app_user_id) REFERENCES app_user(id) ON DELETE CASCADE,
    CONSTRAINT fk_file_type FOREIGN KEY(file_type_id) REFERENCES file_type(id)
);
CREATE TABLE IF NOT EXISTS album_photo(
    id       INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    album_id INTEGER NOT NULL,
    photo_id INTEGER NOT NULL,
    CONSTRAINT fk_album FOREIGN KEY(album_id) REFERENCES album(id) ON DELETE CASCADE,
    CONSTRAINT fk_photo FOREIGN KEY(photo_id) REFERENCES photo(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS error_event(
    id               INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    app_user_id      INTEGER NOT NULL,
    error_message    TEXT NOT NULL,
    user_description VARCHAR(500) NOT NULL,
    event_timestamp  TIMESTAMP NOT NULL,
    is_resolved      BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_app_user FOREIGN KEY(app_user_id) REFERENCES app_user(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS account_type(
    id   INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    type TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS account_info(
    id                    INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    app_user_id           INTEGER NOT NULL,
    email                 VARCHAR(50) UNIQUE,
    is_email_confirmed    BOOLEAN NOT NULL DEFAULT FALSE,
    account_type_id       INTEGER NOT NULL,
    twofa_code            TEXT,
    twofa_code_expiration TIMESTAMP,
    created_timestamp     TIMESTAMP NOT NULL,
    CONSTRAINT fk_app_user FOREIGN KEY(app_user_id) REFERENCES app_user(id) ON DELETE CASCADE,
    CONSTRAINT fk_account_type FOREIGN KEY(account_type_id) REFERENCES account_type(id)
);
CREATE TABLE IF NOT EXISTS account_type_limit(
    id                          INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    monthly_upload_byte_limit   BIGINT NOT NULL,
    monthly_download_byte_limit BIGINT NOT NULL,
    account_type_id             INTEGER NOT NULL,
    CONSTRAINT fk_account_type FOREIGN KEY(account_type_id) REFERENCES account_type(id)
);
CREATE TABLE IF NOT EXISTS account_data_usage(
    id              INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    account_info_id INTEGER NOT NULL,
    month           TEXT NOT NULL,
    upload_amount   BIGINT NOT NULL DEFAULT 0,
    download_amount BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_account_info FOREIGN KEY(account_info_id) REFERENCES account_info(id) ON DELETE CASCADE
);