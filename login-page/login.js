const btn=document.getElementById("togglePassword");
const passwordEl=document.querySelector(".pass");

btn.addEventListener("click",() => {
    if (passwordEl.type === "password"){
        passwordEl.type="text";
        btn.classList.replace("fa-eye","fa-eye-slash");
    }else{
        passwordEl.type="password";
        btn.classList.replace("fa-eye-slash","fa-eye");
    }
});
const btn2=document.getElementById("togglePassword2");
const passwordE2=document.querySelector(".pass2");

btn2.addEventListener("click",() => {
    if (passwordE2.type === "password"){
        passwordE2.type="text";
        btn2.classList.replace("fa-eye","fa-eye-slash");
    }else{
        passwordE2.type="password";
        btn2.classList.replace("fa-eye-slash","fa-eye");
    }
});

function showform(formID){
    document.querySelectorAll(".form-box").forEach(form => form.classList.remove("active"));
    document.getElementById(formID).classList.add("active");
}