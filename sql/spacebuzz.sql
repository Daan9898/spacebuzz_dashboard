CREATE TABLE Chair (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name_chair VARCHAR(50),
    status_chair VARCHAR(50),
    time_video TIME,
    language VARCHAR(50),
    battery_vr_glasses INT
);

INSERT INTO Chair (name_chair, status_chair, time_video, language, battery_vr_glasses) VALUES
('Chair 1', 'Playing', '10:37', 'Dutch', 50),
('Chair 2', 'Paused', '05:30', 'Dutch', 100),
('Chair 3', 'Stopped', '00:00', 'Dutch', 100),
('Chair 4', 'Playing', '10:37', 'Dutch', 51),
('Chair 5', 'Playing', '10:37', 'Dutch', 52),
('Chair 6', 'Playing', '00:00', 'Dutch', 100),
('Chair 7', 'Stopped', '00:00', 'Dutch', 20),
('Chair 8', 'Playing', '00:00', 'Dutch', 100),
('Chair 9', 'Playing', '00:00', 'Dutch', 100);


CREATE TABLE `Group` (
    id INT PRIMARY KEY AUTO_INCREMENT,
    massage_text_1 TEXT,
    video VARCHAR(100),
    massage_text_2 TEXT
);

CREATE TABLE Assigned_Chairs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    chair_id INT,
    group_id INT,
    FOREIGN KEY (chair_id) REFERENCES Chair(id),
    FOREIGN KEY (group_id) REFERENCES `Group`(id)
);

CREATE TABLE Video (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    time_long TIME,
    language VARCHAR(50)
);
