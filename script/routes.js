const readline = require('readline');
const { app, db } = require('../script/server');
const ffmpeg = require('fluent-ffmpeg');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');


const obterEntradaUsuario = (pergunta) => {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question(pergunta, (resposta) => {
            rl.close();
            resolve(resposta);
        });
    });
};

const convertToMp3 = async (url, callback) => {
    
    const musicasBaixadasDir = path.join(__dirname, 'musicasBaixadas');

    
    if (!fs.existsSync(musicasBaixadasDir)) {
        fs.mkdirSync(musicasBaixadasDir);
    }

    try {
        const musica = await obterEntradaUsuario("Digite o nome da Música (sem extensão): ");
        const videoFilePath = path.join(musicasBaixadasDir, `${musica}.mp4`); // Adiciona extensão de vídeo
        const mp3FilePath = path.join(musicasBaixadasDir, `${musica}.mp3`); // Adiciona extensão MP3

        
        exec(`yt-dlp -f bestaudio ${url} -o ${videoFilePath}`, (error) => {
            if (error) {
                return callback(new Error('Failed to download video'));
            }

            // Converter para MP3
            ffmpeg(videoFilePath)
                .output(mp3FilePath)
                .on('end', () => {
                    fs.unlinkSync(videoFilePath); 
                    callback(null, mp3FilePath);
                })
                .on('error', (err) => {
                    fs.unlinkSync(videoFilePath); 
                    callback(err);
                })
                .run();
        });
    } catch (error) {
        callback(error);
    }
};

app.post("/music", (req, res) => {
    const { namem, author, audioLink, image } = req.body;
    convertToMp3(audioLink, (error, mp3FilePath) => {
        if (error) {
            return res.status(500).send(error.message);
        }
        const music = {
            namem, author, audioLink: mp3FilePath, image
        };
        const mysql = "INSERT INTO music SET ?";
        db.query(mysql, music, (err, result) => {
            if (err) {
                res.status(400).send(err.message);
            } else {
                res.status(201).json({ id: result.insertId, ...music });
            }
        });
    });
});

app.get("/music", (req, res)=>{
    const mysql = "SELECT * FROM music";
    let err = new Error("Not Found all music's")
    db.query(mysql,(err, results)=>{
        if(err){
            res.status(404).send(err.message);
        }
        else{
            res.status(200).json(results);
        }
    })
})

app.get("/music/:id", (req, res)=>{
    const {id} = req.params;
    const mysql = "SELECT * FROM music WHERE id = ?";
    let err = new Error("Not Found this music")
    db.query(mysql, [id], (err, result)=>{
        if(err){
            res.status(404).send(err.message);
        }
        else{
            res.status(200).json(result[0]);
        }
    })
})


app.put("/music/:id", (req,res)=>{
    const mysql = "UPDATE music SET? WHERE id = ?"
    const {id} = req.params;
    const {
        namem, author,  audioLink, image
    } = req.body 
    const music = {
        namem, author, audioLink, image
    }
    let err = new Error ("falied to update music")
    db.query (mysql, [music, id],(err, result) =>{
        if (err) {
            res.status(400).send(err.message)
        } else {
            res.status(201).json({id,...music})
        }
    })
})

app.delete("/music/:id", (req, res) => {
    const {id} = req.params
    const mysql = "DELETE FROM music WHERE id = ?";
    let err = new Error(`Failed to Delete ${id}`);
    db.query(mysql, [id], (err, result) =>{
        if(err){
            res.status(400).send(err.message);
        }
        else{
            res.status(200).json({message: `Deleted: ${id}`});
        }
    })
})
