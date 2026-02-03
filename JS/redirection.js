

const dashBoard = document.getElementById("dashboard")
const myTasks = document.getElementById("myTasks")
const proFile  = document.getElementById("proFile")
const closeAccount = document.getElementById("closeAccount")

dashBoard.addEventListener("click", (e) =>{
    window.location = "../dashboard.html"
})
myTasks.addEventListener("click", (e) =>{
    window.location = "../tasks.html"
})
proFile.addEventListener("click", (e) =>{
    window.location = "../profile.html"
})
closeAccount.addEventListener("click", (e) =>{
    window.location = "../index.html"
})