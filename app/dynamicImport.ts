export async function importOggOpusDecoder() {
    return import(
        /* webpackChunkName: "ogg-opus-decoder" */ "ogg-opus-decoder"
    );
}
