using System;
using Unity.VisualScripting;
using UnityEngine;
using UnityEngine.UI;

public class LoginManager : MonoBehaviour
{
    public InputField loginId;
    public Button loginBtn;

    void Start()
    {
        loginBtn.onClick.AddListener(OnClickLogin);
    }

    public void OnClickLogin()
    {
        String id = loginId.text;

        Debug.Log("입력한 닉네임 : " + id);
        // TODO: 서버로 로그인 요청 보내기
    }

}
