import React from 'react';

const Tokusho = () => {
    // Styles for a clean, professional look
    const styles = {
        container: {
            maxWidth: '800px',
            margin: '40px auto',
            padding: '20px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            color: '#333',
            lineHeight: '1.6',
        },
        header: {
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '30px',
            textAlign: 'center',
            paddingBottom: '10px',
            borderBottom: '2px solid #eaeaea'
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse',
            border: '1px solid #eaeaea',
        },
        th: {
            width: '30%',
            padding: '15px',
            textAlign: 'left',
            backgroundColor: '#f9fafb',
            borderBottom: '1px solid #eaeaea',
            fontWeight: '600',
            fontSize: '14px',
            whiteSpace: 'nowrap', // Prevents title from breaking awkwardly
        },
        td: {
            padding: '15px',
            borderBottom: '1px solid #eaeaea',
            fontSize: '14px',
        },
        note: {
            display: 'block',
            marginTop: '5px',
            fontSize: '12px',
            color: '#666',
        }
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>特定商取引法に基づく表記</h1>

            <table style={styles.table}>
                <tbody>
                    <tr>
                        <th style={styles.th}>販売業者</th>
                        <td style={styles.td}>
                            吉田 勇馬
                        </td>
                    </tr>

                    <tr>
                        <th style={styles.th}>運営統括責任者</th>
                        <td style={styles.td}>
                            吉田 勇馬
                        </td>
                    </tr>

                    <tr>
                        <th style={styles.th}>所在地</th>
                        <td style={styles.td}>
                            〒211-0006<br />
                            神奈川県川崎市中原区丸子通2-457-1 204
                        </td>
                    </tr>

                    <tr>
                        <th style={styles.th}>電話番号</th>
                        <td style={styles.td}>
                            080-7539-5183<br />
                            <span style={styles.note}>
                                ※電話でのお問い合わせは受け付けておりません。お問い合わせは下記メールアドレスにてお願いいたします。
                            </span>
                        </td>
                    </tr>

                    <tr>
                        <th style={styles.th}>メールアドレス</th>
                        <td style={styles.td}>
                            wer.corp.smarter@gmail.com
                        </td>
                    </tr>

                    <tr>
                        <th style={styles.th}>販売価格</th>
                        <td style={styles.td}>
                            購入手続き画面に表示されます（表示価格は消費税込み）。
                        </td>
                    </tr>

                    <tr>
                        <th style={styles.th}>商品代金以外の必要料金</th>
                        <td style={styles.td}>
                            当サイトの閲覧、コンテンツのダウンロード、お問い合わせ等の際の電子メールの送受信時などに、所定の通信料が発生いたします。
                        </td>
                    </tr>

                    <tr>
                        <th style={styles.th}>お支払方法</th>
                        <td style={styles.td}>
                            クレジットカード決済（Stripe）
                        </td>
                    </tr>

                    <tr>
                        <th style={styles.th}>お支払時期</th>
                        <td style={styles.td}>
                            ご利用のクレジットカードの締め日や契約内容により異なります。ご利用されるカード会社までお問い合わせください。
                        </td>
                    </tr>

                    <tr>
                        <th style={styles.th}>商品の引渡時期</th>
                        <td style={styles.td}>
                            クレジットカード決済完了後、直ちにご利用いただけます。
                        </td>
                    </tr>

                    <tr>
                        <th style={styles.th}>返品・キャンセルについて</th>
                        <td style={styles.td}>
                            デジタルコンテンツの性質上、購入確定後の返品・交換・キャンセルはお受けできません。<br />
                            解約をご希望の場合は、マイページよりいつでも解約手続きが可能です（次回更新日以降の請求が停止されます）。
                        </td>
                    </tr>

                    <tr>
                        <th style={styles.th}>動作環境</th>
                        <td style={styles.td}>
                            推奨ブラウザ：Google Chrome, Safari, Firefox, Edge の最新版<br />
                            ※JavaScriptおよびCookieを有効にしてご利用ください。
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default Tokusho;
